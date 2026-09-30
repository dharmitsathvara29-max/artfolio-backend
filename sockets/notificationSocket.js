const jwt = require('jsonwebtoken');

// In-memory mapping of userId -> Set of socketIds (supports multi-tab / multi-device)
const userSocketMap = new Map();

/**
 * Initialize Socket.io connection handling and authentication.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

    // Client authenticates and registers userId
    socket.on('identify', (payload) => {
      try {
        const token = typeof payload === 'string' ? payload : payload?.token;
        if (!token) {
          socket.emit('error', { message: 'Token is required to identify' });
          return;
        }

        const jwtSecret = process.env.JWT_SECRET || 'artfolio_default_jwt_secret_dev_key';
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;

        socket.userId = userId;

        if (!userSocketMap.has(userId)) {
          userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId).add(socket.id);

        console.log(`👤 User identified on socket: ${userId} -> Socket: ${socket.id}`);
        socket.emit('identified', {
          success: true,
          message: 'Socket identified successfully',
          userId
        });
      } catch (err) {
        console.error('Socket identify verification failed:', err.message);
        socket.emit('error', { message: 'Invalid token for socket identification' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      if (socket.userId && userSocketMap.has(socket.userId)) {
        const userSockets = userSocketMap.get(socket.userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketMap.delete(socket.userId);
        }
      }
      console.log(`🔌 Client disconnected from Socket.io: ${socket.id}`);
    });
  });
};

/**
 * Emit a real-time notification to a specific user if they are currently connected.
 * 
 * @param {import('socket.io').Server} io - Socket.io server instance
 * @param {string} recipientId - MongoDB ObjectId string of the recipient
 * @param {object} notificationDoc - Notification document object
 */
const emitNotification = (io, recipientId, notificationDoc) => {
  if (!io || !recipientId) return;

  const recipientKey = recipientId.toString();
  const socketIds = userSocketMap.get(recipientKey);

  if (socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => {
      io.to(socketId).emit('notification:new', notificationDoc);
    });
    console.log(`🔔 Notification emitted to user ${recipientKey} across ${socketIds.size} socket(s)`);
  } else {
    console.log(`🔕 User ${recipientKey} not connected via socket; notification persisted to database.`);
  }
};

/**
 * Create and persist a Notification doc in MongoDB, then emit via Socket.io if recipient is connected.
 */
const sendNotification = async (io, { recipient, type, message, relatedId = null }) => {
  const Notification = require('../models/Notification');
  const notification = await Notification.create({
    recipient,
    type,
    message,
    relatedId
  });
  emitNotification(io, recipient, notification);
  return notification;
};

module.exports = {
  initSocket,
  emitNotification,
  sendNotification,
  userSocketMap
};
