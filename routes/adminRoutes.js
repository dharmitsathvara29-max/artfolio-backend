const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getArtworksForModeration,
  moderateArtwork
} = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');

const moderateValidation = [
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'featured'])
    .withMessage("Status must be one of: 'pending', 'approved', 'rejected', 'featured'")
];

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Platform moderation and administration
 */

/**
 * @swagger
 * /api/admin/artworks:
 *   get:
 *     summary: List all artworks for moderation (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, featured]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of artworks across all moderation statuses
 *       403:
 *         description: Admin access required
 */
router.get('/artworks', auth, checkRole('admin'), getArtworksForModeration);

/**
 * @swagger
 * /api/admin/moderate/{id}:
 *   put:
 *     summary: Moderate artwork - approve, reject, or feature (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, featured]
 *                 example: featured
 *     responses:
 *       200:
 *         description: Artwork moderated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Artwork not found
 */
router.put(
  '/moderate/:id',
  auth,
  checkRole('admin'),
  validate(moderateValidation),
  moderateArtwork
);

module.exports = router;
