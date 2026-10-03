const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app real-time notifications via Socket.io
 */

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send a notification to a user (Admin or System)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId, type, message]
 *             properties:
 *               recipientId: { type: string, example: 507f1f77bcf86cd799439011 }
 *               type:        { type: string, enum: [new_comment, new_like, new_commission, sale_recorded] }
 *               message:     { type: string, example: "Someone liked your artwork!" }
 *               relatedId:   { type: string, description: "Optional related document ID" }
 *     responses:
 *       201:
 *         description: Notification sent and persisted
 *       404:
 *         description: Recipient not found
 */
router.post('/send', auth, validate([
  body('recipientId').isMongoId(),
  body('type').isIn(['new_comment', 'new_like', 'new_commission', 'sale_recorded']),
  body('message').trim().notEmpty()
]), ctrl.sendNotification);

/**
 * @swagger
 * /api/notifications/my:
 *   get:
 *     summary: Get current user's notifications (paginated + unread count)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Notifications with unreadCount
 */
router.get('/my', auth, ctrl.getMyNotifications);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all of current user's notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/mark-all-read', auth, ctrl.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/:id/read', auth, ctrl.markAsRead);

module.exports = router;
