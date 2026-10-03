const Commission = require('../models/Commission');
const Artist = require('../models/Artist');
const { sendNotification } = require('../sockets/notificationSocket');

// POST /api/commissions
exports.requestCommission = async (req, res, next) => {
  try {
    const { artistId, description, budget } = req.body;
    const artist = await Artist.findById(artistId);
    if (!artist || artist.role !== 'artist')
      return res.status(404).json({ success: false, message: 'Artist not found' });
    if (artistId === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot commission yourself' });

    const commission = await Commission.create({
      artist: artist._id, requester: req.user.id,
      description, budget: Number(budget)
    });

    await sendNotification(req.app.locals.io, {
      recipient: artist._id, type: 'new_commission',
      message: `${req.user.name || 'A client'} requested a commission (Budget: ₹${budget})`,
      relatedId: commission._id
    });

    res.status(201).json({ success: true, data: commission });
  } catch (err) { next(err); }
};

// GET /api/commissions
exports.getAllCommissions = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { requester: req.user.id };
    const commissions = await Commission.find(query)
      .populate('artist', 'name email profileImageUrl')
      .populate('requester', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: commissions.length, data: commissions });
  } catch (err) { next(err); }
};

// GET /api/commissions/artist/:id
exports.getArtistCommissions = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });
    const commissions = await Commission.find({ artist: req.params.id })
      .populate('requester', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: commissions.length, data: commissions });
  } catch (err) { next(err); }
};

// PUT /api/commissions/:id/status
exports.updateCommissionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'declined', 'completed'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });

    const commission = await Commission.findById(req.params.id);
    if (!commission) return res.status(404).json({ success: false, message: 'Commission not found' });
    if (commission.artist.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    commission.status = status;
    await commission.save();
    res.json({ success: true, data: commission });
  } catch (err) { next(err); }
};
