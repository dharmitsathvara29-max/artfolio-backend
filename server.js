require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
require('./config/supabase');
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

// ─── Swagger ─────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ArtFolio API',
      version: '2.0.0',
      description: `
**ArtFolio** — Digital Art Portfolio & Gallery Platform

### Roles
| Role | Permissions |
|---|---|
| \`visitor\` | Browse gallery, like, comment, request commissions |
| \`artist\` | All visitor rights + upload artworks, record sales |
| \`admin\` | All rights + moderate artworks, send notifications |

### Authentication
All protected routes require a **Bearer JWT token**.
1. Register → \`POST /api/auth/register\`
2. Login → \`POST /api/auth/login\`
3. Copy the \`token\` from the response
4. Click **Authorize** (lock icon) → paste \`<token>\`

### Real-time Events (Socket.io)
Connect to \`ws://localhost:${process.env.PORT || 5001}\`
- Emit \`identify\` with your JWT token after connecting
- Listen for \`notification:new\` events
      `
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5001}`, description: 'Local Dev' },
      { url: 'https://artfolio-backend.onrender.com', description: 'Production (Render)' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token obtained from /api/auth/login'
        }
      }
    }
  },
  apis: ['./routes/*.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ArtFolio API Docs',
  swaggerOptions: { persistAuthorization: true }
}));

// Expose raw spec for Postman import
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
// ─────────────────────────────────────────────────────────────────────────────

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
app.get('/', (req, res) => res.json({
  success: true,
  service: 'ArtFolio API',
  version: '2.0.0',
  docs: `http://localhost:${process.env.PORT || 5001}/api-docs`
}));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE')
    console.error(`❌ Port ${PORT} in use. Set PORT= in .env (macOS: AirPlay uses 5000 — use 5001+)`);
  else
    console.error('❌ Server error:', err.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`🚀 ArtFolio API  →  http://localhost:${PORT}`);
  console.log(`📚 Swagger Docs  →  http://localhost:${PORT}/api-docs`);
  console.log(`📦 OpenAPI JSON  →  http://localhost:${PORT}/api-docs.json`);
});

module.exports = { app, server };
