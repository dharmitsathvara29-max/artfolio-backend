const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Configuration imports
const connectDB = require('./config/db');
require('./config/supabase'); // Initializes Supabase Storage client

// Socket handler
const { initSocket } = require('./sockets/notificationSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const artistRoutes = require('./routes/artistRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const saleRoutes = require('./routes/saleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Error handler middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize MongoDB connection
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io instance to app.locals for controllers
app.locals.io = io;

// Wire Socket.io notification handlers
initSocket(io);

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ArtFolio API Documentation',
      version: '1.0.0',
      description:
        'REST API for ArtFolio — A Digital Art Portfolio & Gallery platform with real-time notifications, Supabase Storage, and role-based access control.',
      contact: {
        name: 'ArtFolio Backend Engineering Team'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local Development Server'
      },
      {
        url: 'https://artfolio-backend.onrender.com',
        description: 'Production Render Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root Health / Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'ArtFolio REST API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      artworks: '/api/artworks',
      artists: '/api/artists',
      comments: '/api/comments',
      likes: '/api/likes',
      commissions: '/api/commissions',
      sales: '/api/sales',
      admin: '/api/admin',
      notifications: '/api/notifications'
    }
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('💡 Tip for macOS users: Port 5000 is frequently reserved by macOS AirPlay Receiver.');
    console.error('👉 Set PORT=5001 (or another free port) in your .env file or run with PORT=5001 npm run dev');
  } else {
    console.error('❌ Server startup error:', err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 ArtFolio Server listening on port ${PORT}`);
  console.log(`📚 Swagger API Docs available at http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server };
