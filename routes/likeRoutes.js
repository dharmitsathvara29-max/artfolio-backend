const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { addLike, getLikes, removeLike } = require('../controllers/likeController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const likeValidation = [
  body('artworkId').isMongoId().withMessage('Valid artworkId is required')
];

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Artwork favorites and like counts
 */

/**
 * @swagger
 * /api/likes:
 *   post:
 *     summary: Like an artwork
 *     tags: [Likes]
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
 *             properties:
 *               artworkId:
 *                 type: string
 *                 example: 64b8e3a2f1c8a1b2c3d4e5f6
 *     responses:
 *       201:
 *         description: Artwork liked successfully
 *       400:
 *         description: Already liked or validation error
 *       404:
 *         description: Artwork not found
 */
router.post('/', auth, validate(likeValidation), addLike);

/**
 * @swagger
 * /api/likes:
 *   get:
 *     summary: List likes (filter by artworkId or userId)
 *     tags: [Likes]
 *     parameters:
 *       - in: query
 *         name: artworkId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of likes
 */
router.get('/', getLikes);

/**
 * @swagger
 * /api/likes/{id}:
 *   delete:
 *     summary: Unlike an artwork
 *     tags: [Likes]
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
 *         description: Artwork unliked
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Like record not found
 */
router.delete('/:id', auth, removeLike);

module.exports = router;
