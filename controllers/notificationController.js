const Notification = require('../models/Notification');
const Artist = require('../models/Artist');
const { emitNotification } = require('../sockets/notificationSocket');

/**
 * @desc    Manually send & emit a notification (Admin / Internal / Testing)
 * @route   POST /api/notifications/send
 * @access  Protected
 */
const sendNotification = async (req, res, next) => {
  try {
    const { recipientId, type, message, relatedId } = req.body;

    // Validate recipient exists
    const recipient = await Artist.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    const notification = await Notification.create({
      recipient: recipient._id,
      type,
      message: message.trim(),
      relatedId: relatedId || null
    });

    // Emit in real-time if connected
    const io = req.app.locals.io;
    emitNotification(io, recipient._id, notification);

    res.status(201).json({
      success: true,
      message: 'Notification sent and saved',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's notifications with unread count
 * @route   GET /api/notifications/my
 * @access  Protected
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    const total = await Notification.countDocuments({ recipient: req.user.id });

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      unreadCount,
      total,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Protected
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Protected
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
