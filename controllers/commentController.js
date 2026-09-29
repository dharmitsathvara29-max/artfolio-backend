const Comment = require('../models/Comment');
const Artwork = require('../models/Artwork');
const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/notificationSocket');

/**
 * @desc    Add a comment to an artwork
 * @route   POST /api/comments
 * @access  Protected
 */
const addComment = async (req, res, next) => {
  try {
    const { artworkId, text } = req.body;

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Create the comment
    const comment = await Comment.create({
      artwork: artwork._id,
      author: req.user.id,
      text: text.trim()
    });

    // Increment artwork commentsCount
    artwork.commentsCount = (artwork.commentsCount || 0) + 1;
    await artwork.save();

    // Populate author details for response
    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name email profileImageUrl'
    );

    // Notify artist if commenter is not the artwork owner
    if (artwork.artist.toString() !== req.user.id) {
      const commenterName = req.user.name || 'Someone';
      const notification = await Notification.create({
        recipient: artwork.artist,
        type: 'new_comment',
        message: `${commenterName} commented on your artwork "${artwork.title}"`,
        relatedId: artwork._id
      });

      // Emit real-time notification via Socket.io
      const io = req.app.locals.io;
      emitNotification(io, artwork.artist, notification);
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all comments (admin/debug, paginated)
 * @route   GET /api/comments
 * @access  Public / Admin debug
 */
const getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Comment.countDocuments();
    const comments = await Comment.find()
      .populate('author', 'name email profileImageUrl')
      .populate('artwork', 'title imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comments for a specific artwork
 * @route   GET /api/comments/artwork/:id
 * @access  Public
 */
const getCommentsByArtwork = async (req, res, next) => {
  try {
    const comments = await Comment.find({ artwork: req.params.id })
      .populate('author', 'name email profileImageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getAllComments,
  getCommentsByArtwork
};
