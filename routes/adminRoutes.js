const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only moderation endpoints
 */

/**
 * @swagger
 * /api/admin/artworks:
 *   get:
 *     summary: Get artworks for moderation (filterable by status)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, featured] }
 *         description: Filter by moderation status (default — all)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Artworks list for moderation
 *       403:
 *         description: Admin only
 */
router.get('/artworks', auth, checkRole('admin'), ctrl.getArtworksForModeration);

/**
 * @swagger
 * /api/admin/moderate/{id}:
 *   put:
 *     summary: Approve, reject, or feature an artwork
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Artwork ID to moderate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, approved, rejected, featured] }
 *     responses:
 *       200:
 *         description: Artwork status updated — artist notified via Socket.io
 *       404:
 *         description: Artwork not found
 */
router.put('/moderate/:id', auth, checkRole('admin'),
  validate([body('status').isIn(['pending', 'approved', 'rejected', 'featured'])]),
  ctrl.moderateArtwork
);

module.exports = router;
