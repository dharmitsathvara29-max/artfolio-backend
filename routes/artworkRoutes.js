const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/artworkController');
const { auth, optionalAuth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').optional().isNumeric()
];

/**
 * @swagger
 * tags:
 *   name: Artworks
 *   description: Artwork management and gallery browsing
 */

/**
 * @swagger
 * /api/artworks:
 *   get:
 *     summary: Browse approved/featured artworks
 *     tags: [Artworks]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *         description: Filter by tag
 *       - in: query
 *         name: artist
 *         schema: { type: string }
 *         description: Filter by artist ObjectId
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, featured] }
 *         description: Admin only — override status filter
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of artworks
 */
router.get('/', optionalAuth, ctrl.getArtworks);

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
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Artwork details with artist info
 *       404:
 *         description: Artwork not found
 */
router.get('/:id', ctrl.getArtworkById);

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
 *             required: [title, description, image]
 *             properties:
 *               title:       { type: string, example: Sunset Dreams }
 *               description: { type: string, example: Atmospheric neon twilight landscape }
 *               tags:        { type: string, example: "nature, landscape, sunset" }
 *               category:    { type: string, example: Digital Painting }
 *               price:       { type: number, example: 5000 }
 *               image:       { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Artwork submitted for moderation
 *       403:
 *         description: Only artists can upload artworks
 */
router.post('/', auth, checkRole('artist'), upload.single('image'), validate(createRules), ctrl.createArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   put:
 *     summary: Update artwork (Owner only)
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               tags:        { type: string }
 *               price:       { type: number }
 *               image:       { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Artwork updated
 *       403:
 *         description: Not the artwork owner
 *       404:
 *         description: Artwork not found
 */
router.put('/:id', auth, upload.single('image'), ctrl.updateArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   delete:
 *     summary: Delete artwork — cascades comments & likes (Owner or Admin)
 *     tags: [Artworks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Artwork deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Artwork not found
 */
router.delete('/:id', auth, ctrl.deleteArtwork);

module.exports = router;
