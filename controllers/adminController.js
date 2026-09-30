const Artwork = require('../models/Artwork');
const { sendNotification } = require('../sockets/notificationSocket');

/**
 * @desc    List all artworks for moderation (all statuses)
 * @route   GET /api/admin/artworks
 * @access  Protected (Role: admin)
 */
const getArtworksForModeration = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Artwork.countDocuments(query);
    const artworks = await Artwork.find(query)
      .populate('artist', 'name email profileImageUrl role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: artworks.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: artworks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve / reject / feature an artwork
 * @route   PUT /api/admin/moderate/:id
 * @access  Protected (Role: admin)
 */
const moderateArtwork = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected', 'featured'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    artwork.status = status;
    await artwork.save();

    // Notify the artist about the moderation outcome
    let messageText = `Your artwork "${artwork.title}" status has been updated to "${status}".`;
    if (status === 'featured') {
      messageText = `🎉 Your artwork "${artwork.title}" has been curated as FEATURED on ArtFolio!`;
    } else if (status === 'approved') {
      messageText = `✅ Your artwork "${artwork.title}" has been approved and is now live in the gallery.`;
    } else if (status === 'rejected') {
      messageText = `⚠️ Your artwork "${artwork.title}" was not approved by content moderation.`;
    }

    await sendNotification(req.app.locals.io, {
      recipient: artwork.artist,
      type: 'new_comment',
      message: messageText,
      relatedId: artwork._id
    });

    res.status(200).json({
      success: true,
      message: `Artwork status updated to '${status}'`,
      data: artwork
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArtworksForModeration,
  moderateArtwork
};
