const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

const userSocketMap = new Map(); // userId -> Set of socketIds

const initSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('identify', (payload) => {
      try {
        const token = typeof payload === 'string' ? payload : payload?.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'artfolio_dev_secret');
        socket.userId = decoded.id;
        if (!userSocketMap.has(decoded.id)) userSocketMap.set(decoded.id, new Set());
        userSocketMap.get(decoded.id).add(socket.id);
        socket.emit('identified', { success: true, userId: decoded.id });
      } catch {
        socket.emit('error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        const sockets = userSocketMap.get(socket.userId);
        if (sockets) { sockets.delete(socket.id); if (!sockets.size) userSocketMap.delete(socket.userId); }
      }
    });
  });
};

const emitNotification = (io, recipientId, notification) => {
  const sockets = userSocketMap.get(recipientId?.toString());
  if (io && sockets?.size) sockets.forEach(id => io.to(id).emit('notification:new', notification));
};

const sendNotification = async (io, { recipient, type, message, relatedId = null }) => {
  const notification = await Notification.create({ recipient, type, message, relatedId });
  emitNotification(io, recipient, notification);
  return notification;
};

module.exports = { initSocket, emitNotification, sendNotification };
