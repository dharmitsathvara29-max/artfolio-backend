const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/commentController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Artwork comments
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Add a comment on an artwork
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [artworkId, text]
 *             properties:
 *               artworkId: { type: string, example: 507f1f77bcf86cd799439011 }
 *               text:      { type: string, example: Absolutely stunning work! }
 *     responses:
 *       201:
 *         description: Comment added
 *       404:
 *         description: Artwork not found
 */
router.post('/', auth, validate([
  body('artworkId').isMongoId(),
  body('text').trim().notEmpty()
]), ctrl.addComment);

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get all comments (admin/paginated)
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated comment list
 */
router.get('/', ctrl.getAllComments);

/**
 * @swagger
 * /api/comments/artwork/{id}:
 *   get:
 *     summary: Get all comments for a specific artwork
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Artwork ID
 *     responses:
 *       200:
 *         description: List of comments for this artwork
 */
router.get('/artwork/:id', ctrl.getCommentsByArtwork);

module.exports = router;
