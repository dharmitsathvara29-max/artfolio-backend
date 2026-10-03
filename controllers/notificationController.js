const Notification = require('../models/Notification');
const Artist = require('../models/Artist');
const { sendNotification: push } = require('../sockets/notificationSocket');

// POST /api/notifications/send
exports.sendNotification = async (req, res, next) => {
  try {
    const { recipientId, type, message, relatedId } = req.body;
    const recipient = await Artist.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });
    const notification = await push(req.app.locals.io, { recipient: recipient._id, type, message, relatedId });
    res.status(201).json({ success: true, data: notification });
  } catch (err) { next(err); }
};

// GET /api/notifications/my
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [unreadCount, total, notifications] = await Promise.all([
      Notification.countDocuments({ recipient: req.user.id, read: false }),
      Notification.countDocuments({ recipient: req.user.id }),
      Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    ]);
    res.json({ success: true, unreadCount, total, data: notifications });
  } catch (err) { next(err); }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (n.recipient.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });
    n.read = true;
    await n.save();
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
};

// PUT /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};
