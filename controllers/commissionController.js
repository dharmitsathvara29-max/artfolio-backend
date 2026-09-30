const Commission = require('../models/Commission');
const Artist = require('../models/Artist');
const { sendNotification } = require('../sockets/notificationSocket');

/**
 * @desc    Request a commission from an artist
 * @route   POST /api/commissions
 * @access  Protected
 */
const requestCommission = async (req, res, next) => {
  try {
    const { artistId, description, budget } = req.body;

    // Check target artist
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Target artist not found'
      });
    }

    if (artist.role !== 'artist') {
      return res.status(400).json({
        success: false,
        message: 'The selected user is not an artist'
      });
    }

    // Prevent commissioning self
    if (artist._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request a commission from yourself'
      });
    }

    const commission = await Commission.create({
      artist: artist._id,
      requester: req.user.id,
      description: description.trim(),
      budget: Number(budget),
      status: 'pending'
    });

    const populatedCommission = await Commission.findById(commission._id)
      .populate('artist', 'name email profileImageUrl')
      .populate('requester', 'name email');

    await sendNotification(req.app.locals.io, {
      recipient: artist._id,
      type: 'new_commission',
      message: `${req.user.name || 'A client'} requested a commission: "${description.substring(0, 50)}..." (Budget: ₹${budget})`,
      relatedId: commission._id
    });

    res.status(201).json({
      success: true,
      message: 'Commission request submitted successfully',
      data: populatedCommission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all commissions (admin / debug)
 * @route   GET /api/commissions
 * @access  Protected (Admin only, or returns authenticated user's sent commissions)
 */
const getAllCommissions = async (req, res, next) => {
  try {
    const query = {};

    // If not admin, restrict to user's sent commissions
    if (req.user.role !== 'admin') {
      query.requester = req.user.id;
    }

    const commissions = await Commission.find(query)
      .populate('artist', 'name email profileImageUrl')
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: commissions.length,
      data: commissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get commissions received by a specific artist
 * @route   GET /api/commissions/artist/:id
 * @access  Protected (Target artist or Admin only)
 */
const getArtistCommissions = async (req, res, next) => {
  try {
    const artistId = req.params.id;

    // Check authorization: only the artist themselves or admin can view received commissions
    if (req.user.id !== artistId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own received commissions'
      });
    }

    const commissions = await Commission.find({ artist: artistId })
      .populate('requester', 'name email profileImageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: commissions.length,
      data: commissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update commission status (accept, decline, complete)
 * @route   PUT /api/commissions/:id/status
 * @access  Protected (Target artist or Admin)
 */
const updateCommissionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'accepted', 'declined', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    // Must be the assigned artist or admin
    if (commission.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned artist can update this commission status'
      });
    }

    commission.status = status;
    await commission.save();

    res.status(200).json({
      success: true,
      message: `Commission status updated to '${status}'`,
      data: commission
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestCommission,
  getAllCommissions,
  getArtistCommissions,
  updateCommissionStatus
};
