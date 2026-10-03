const Like = require('../models/Like');
const Artwork = require('../models/Artwork');
const { sendNotification } = require('../sockets/notificationSocket');

// POST /api/likes
exports.addLike = async (req, res, next) => {
  try {
    const { artworkId } = req.body;
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
    if (await Like.findOne({ artwork: artwork._id, user: req.user.id }))
      return res.status(400).json({ success: false, message: 'Already liked' });

    const like = await Like.create({ artwork: artwork._id, user: req.user.id });
    artwork.likesCount += 1;
    await artwork.save();

    if (artwork.artist.toString() !== req.user.id)
      await sendNotification(req.app.locals.io, {
        recipient: artwork.artist, type: 'new_like',
        message: `${req.user.name || 'Someone'} liked "${artwork.title}"`,
        relatedId: artwork._id
      });

    res.status(201).json({ success: true, data: like });
  } catch (err) { next(err); }
};

// GET /api/likes
exports.getLikes = async (req, res, next) => {
  try {
    const { artworkId, userId } = req.query;
    const query = {};
    if (artworkId) query.artwork = artworkId;
    if (userId) query.user = userId;
    const likes = await Like.find(query).populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: likes.length, data: likes });
  } catch (err) { next(err); }
};

// DELETE /api/likes/:id
exports.removeLike = async (req, res, next) => {
  try {
    const like = await Like.findById(req.params.id);
    if (!like) return res.status(404).json({ success: false, message: 'Like not found' });
    if (like.user.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const artwork = await Artwork.findById(like.artwork);
    if (artwork && artwork.likesCount > 0) { artwork.likesCount -= 1; await artwork.save(); }
    await Like.findByIdAndDelete(like._id);
    res.json({ success: true, message: 'Unliked' });
  } catch (err) { next(err); }
};
