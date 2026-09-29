const Like = require('../models/Like');
const Artwork = require('../models/Artwork');
const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/notificationSocket');

/**
 * @desc    Like an artwork
 * @route   POST /api/likes
 * @access  Protected
 */
const addLike = async (req, res, next) => {
  try {
    const { artworkId } = req.body;

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Check if user has already liked this artwork
    const existingLike = await Like.findOne({
      artwork: artwork._id,
      user: req.user.id
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this artwork'
      });
    }

    // Create like
    const like = await Like.create({
      artwork: artwork._id,
      user: req.user.id
    });

    // Increment artwork likesCount
    artwork.likesCount = (artwork.likesCount || 0) + 1;
    await artwork.save();

    // Create notification for artist if liker is not the artwork owner
    if (artwork.artist.toString() !== req.user.id) {
      const likerName = req.user.name || 'Someone';
      const notification = await Notification.create({
        recipient: artwork.artist,
        type: 'new_like',
        message: `${likerName} liked your artwork "${artwork.title}"`,
        relatedId: artwork._id
      });

      // Emit real-time notification
      const io = req.app.locals.io;
      emitNotification(io, artwork.artist, notification);
    }

    res.status(201).json({
      success: true,
      message: 'Artwork liked',
      data: like
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get likes (optionally filter by artworkId or userId)
 * @route   GET /api/likes
 * @access  Public
 */
const getLikes = async (req, res, next) => {
  try {
    const { artworkId, userId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (artworkId) query.artwork = artworkId;
    if (userId) query.user = userId;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Like.countDocuments(query);
    const likes = await Like.find(query)
      .populate('user', 'name email profileImageUrl')
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: likes.length,
      total,
      data: likes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlike an artwork (remove like)
 * @route   DELETE /api/likes/:id
 * @access  Protected (Owner only)
 */
const removeLike = async (req, res, next) => {
  try {
    const like = await Like.findById(req.params.id);

    if (!like) {
      return res.status(404).json({
        success: false,
        message: 'Like record not found'
      });
    }

    // Verify ownership
    if (like.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only remove your own likes'
      });
    }

    // Decrement artwork likesCount
    const artwork = await Artwork.findById(like.artwork);
    if (artwork && artwork.likesCount > 0) {
      artwork.likesCount -= 1;
      await artwork.save();
    }

    await Like.findByIdAndDelete(like._id);

    res.status(200).json({
      success: true,
      message: 'Artwork unliked successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addLike,
  getLikes,
  removeLike
};
