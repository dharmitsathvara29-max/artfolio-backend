const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  addComment,
  getAllComments,
  getCommentsByArtwork
} = require('../controllers/commentController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const addCommentValidation = [
  body('artworkId').isMongoId().withMessage('Valid artworkId is required'),
  body('text').trim().notEmpty().withMessage('Comment text cannot be empty')
];

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Artwork discussion and feedback
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Add a comment to an artwork
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artworkId
 *               - text
 *             properties:
 *               artworkId:
 *                 type: string
 *                 example: 64b8e3a2f1c8a1b2c3d4e5f6
 *               text:
 *                 type: string
 *                 example: Gorgeous use of contrasting tones!
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       404:
 *         description: Artwork not found
 */
router.post('/', auth, validate(addCommentValidation), addComment);

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: List all comments (Admin/Debug)
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/', getAllComments);

/**
 * @swagger
 * /api/comments/artwork/{id}:
 *   get:
 *     summary: Get comments for a specific artwork
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments for the artwork
 */
router.get('/artwork/:id', getCommentsByArtwork);

module.exports = router;
