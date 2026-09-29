const express = require('express');
const router = express.Router();
const { getArtists, getArtistById, updateArtist } = require('../controllers/artistController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Artists
 *   description: Artist profile and portfolio discovery
 */

/**
 * @swagger
 * /api/artists:
 *   get:
 *     summary: List all registered artists
 *     tags: [Artists]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by portfolio tag
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by artist name or bio
 *     responses:
 *       200:
 *         description: List of artists
 */
router.get('/', getArtists);

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Get artist profile and their artworks
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist profile and portfolio artworks
 *       404:
 *         description: Artist not found
 */
router.get('/:id', getArtistById);

/**
 * @swagger
 * /api/artists/{id}:
 *   put:
 *     summary: Update artist profile (Owner only)
 *     tags: [Artists]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImageUrl:
 *                 type: string
 *               portfolioTags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Artist profile updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id', auth, updateArtist);

module.exports = router;
