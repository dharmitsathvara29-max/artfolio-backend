const Comment = require('../models/Comment');
const Artwork = require('../models/Artwork');
const { sendNotification } = require('../sockets/notificationSocket');

// POST /api/comments
exports.addComment = async (req, res, next) => {
  try {
    const { artworkId, text } = req.body;
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });

    const comment = await Comment.create({ artwork: artwork._id, author: req.user.id, text: text.trim() });
    artwork.commentsCount += 1;
    await artwork.save();

    const populated = await comment.populate('author', 'name email profileImageUrl');

    if (artwork.artist.toString() !== req.user.id)
      await sendNotification(req.app.locals.io, {
        recipient: artwork.artist, type: 'new_comment',
        message: `${req.user.name || 'Someone'} commented on "${artwork.title}"`,
        relatedId: artwork._id
      });

    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// GET /api/comments
exports.getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [total, comments] = await Promise.all([
      Comment.countDocuments(),
      Comment.find().populate('author', 'name email').populate('artwork', 'title').sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    ]);
    res.json({ success: true, total, data: comments });
  } catch (err) { next(err); }
};

// GET /api/comments/artwork/:id
exports.getCommentsByArtwork = async (req, res, next) => {
  try {
    const comments = await Comment.find({ artwork: req.params.id })
      .populate('author', 'name email profileImageUrl').sort({ createdAt: -1 });
    res.json({ success: true, count: comments.length, data: comments });
  } catch (err) { next(err); }
};
