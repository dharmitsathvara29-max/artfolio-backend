const Artwork = require('../models/Artwork');
const { sendNotification } = require('../sockets/notificationSocket');

const STATUS_MESSAGES = {
  featured: (t) => `🎉 Your artwork "${t}" has been featured on ArtFolio!`,
  approved: (t) => `✅ Your artwork "${t}" is now live in the gallery.`,
  rejected: (t) => `⚠️ Your artwork "${t}" was not approved by moderation.`,
};

// GET /api/admin/artworks
exports.getArtworksForModeration = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [total, artworks] = await Promise.all([
      Artwork.countDocuments(query),
      Artwork.find(query).populate('artist', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    ]);
    res.json({ success: true, total, data: artworks });
  } catch (err) { next(err); }
};

// PUT /api/admin/moderate/:id
exports.moderateArtwork = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'approved', 'rejected', 'featured'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });

    artwork.status = status;
    await artwork.save();

    const msg = (STATUS_MESSAGES[status] || ((t) => `Your artwork "${t}" status is now "${status}"`))(artwork.title);
    await sendNotification(req.app.locals.io, {
      recipient: artwork.artist, type: 'new_comment', message: msg, relatedId: artwork._id
    });

    res.json({ success: true, message: `Status set to "${status}"`, data: artwork });
  } catch (err) { next(err); }
};
