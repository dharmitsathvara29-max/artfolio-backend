require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
require('./config/supabase');                          // init Supabase on startup
const { initSocket } = require('./sockets/notificationSocket');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.locals.io = io;
initSocket(io);

connectDB();

// Core middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/artworks',      require('./routes/artworkRoutes'));
app.use('/api/artists',       require('./routes/artistRoutes'));
app.use('/api/comments',      require('./routes/commentRoutes'));
app.use('/api/likes',         require('./routes/likeRoutes'));
app.use('/api/commissions',   require('./routes/commissionRoutes'));
app.use('/api/sales',         require('./routes/saleRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check
app.get('/', (req, res) => res.json({ success: true, service: 'ArtFolio API', version: '2.0.0', docs: '/api/artworks' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use. Set PORT= in .env (macOS: disable AirPlay Receiver or use 5001)`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 ArtFolio API running on http://localhost:${PORT}`);
});

module.exports = { app, server };
