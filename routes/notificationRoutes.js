const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  sendNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const sendNotificationValidation = [
  body('recipientId').isMongoId().withMessage('Valid recipientId is required'),
  body('type')
    .isIn(['new_comment', 'new_like', 'new_commission', 'sale_recorded'])
    .withMessage("Invalid type. Must be 'new_comment', 'new_like', 'new_commission', or 'sale_recorded'"),
  body('message').trim().notEmpty().withMessage('Message is required')
];

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time and persistent alerts
 */

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Manually send and emit a notification (Testing / Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - type
 *               - message
 *             properties:
 *               recipientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [new_comment, new_like, new_commission, sale_recorded]
 *               message:
 *                 type: string
 *               relatedId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification saved and emitted
 */
router.post('/send', auth, validate(sendNotificationValidation), sendNotification);

/**
 * @swagger
 * /api/notifications/my:
 *   get:
 *     summary: Get current authenticated user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications with unread count
 */
router.get('/my', auth, getMyNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', auth, markAsRead);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/mark-all-read', auth, markAllAsRead);

module.exports = router;
