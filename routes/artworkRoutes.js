const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork
} = require('../controllers/artworkController');
const { auth, optionalAuth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const createArtworkValidation = [
  body('title').trim().notEmpty().withMessage('Artwork title is required'),
  body('description').trim().notEmpty().withMessage('Artwork description is required'),
  body('price').optional().isNumeric().withMessage('Price must be a valid number')
];

/**
 * @swagger
 * tags:
 *   name: Artworks
 *   description: Artwork management and browsing
 */

/**
 * @swagger
 * /api/artworks:
 *   get:
 *     summary: Browse all approved/featured artworks
 *     tags: [Artworks]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: artist
 *         schema:
 *           type: string
 *         description: Filter by artist ObjectId
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Override status filter (Admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of artworks
 */
router.get('/', optionalAuth, getArtworks);

/**
 * @swagger
 * /api/artworks/{id}:
 *   get:
 *     summary: Get artwork details by ID
 *     tags: [Artworks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artwork details
 *       404:
 *         description: Artwork not found
 */
router.get('/:id', getArtworkById);

/**
 * @swagger
 * /api/artworks:
 *   post:
 *     summary: Upload new artwork (Artist role only)
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sunset Dreams
 *               description:
 *                 type: string
 *                 example: Atmospheric landscape with neon twilight hues
 *               tags:
 *                 type: string
 *                 example: nature, landscape, sunset
 *               category:
 *                 type: string
 *                 example: Digital Painting
 *               price:
 *                 type: number
 *                 example: 5000
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Artwork uploaded successfully
 *       400:
 *         description: Validation or upload error
 *       403:
 *         description: Only artists can upload artworks
 */
router.post(
  '/',
  auth,
  checkRole('artist'),
  upload.single('image'),
  validate(createArtworkValidation),
  createArtwork
);

/**
 * @swagger
 * /api/artworks/{id}:
 *   put:
 *     summary: Update artwork details (Owner artist only)
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Artwork updated
 *       403:
 *         description: Not the artwork owner
 *       404:
 *         description: Artwork not found
 */
router.put('/:id', auth, upload.single('image'), updateArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   delete:
 *     summary: Delete artwork and cascade comments/likes (Owner or Admin)
 *     tags: [Artworks]
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
 *         description: Artwork deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Artwork not found
 */
router.delete('/:id', auth, deleteArtwork);

module.exports = router;
