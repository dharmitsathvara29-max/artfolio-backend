const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/likeController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Artwork likes / reactions
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
 *             required: [artworkId]
 *             properties:
 *               artworkId: { type: string, example: 507f1f77bcf86cd799439011 }
 *     responses:
 *       201:
 *         description: Liked successfully
 *       400:
 *         description: Already liked
 *       404:
 *         description: Artwork not found
 */
router.post('/', auth, validate([body('artworkId').isMongoId()]), ctrl.addLike);

/**
 * @swagger
 * /api/likes:
 *   get:
 *     summary: Query likes (filter by artworkId or userId)
 *     tags: [Likes]
 *     parameters:
 *       - in: query
 *         name: artworkId
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of likes
 */
router.get('/', ctrl.getLikes);

/**
 * @swagger
 * /api/likes/{id}:
 *   delete:
 *     summary: Unlike (remove like by like document ID)
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Like document ID
 *     responses:
 *       200:
 *         description: Unliked
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Like not found
 */
router.delete('/:id', auth, ctrl.removeLike);

module.exports = router;
