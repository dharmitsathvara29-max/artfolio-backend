const router = require('express').Router();
const ctrl = require('../controllers/artistController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Artists
 *   description: Artist profile management
 */

/**
 * @swagger
 * /api/artists:
 *   get:
 *     summary: List all artist profiles
 *     tags: [Artists]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of artists
 */
router.get('/', ctrl.getArtists);

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Get artist profile and their approved artworks
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Artist profile with artworks
 *       404:
 *         description: Artist not found
 */
router.get('/:id', ctrl.getArtistById);

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
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:            { type: string }
 *               bio:             { type: string }
 *               profileImageUrl: { type: string }
 *               portfolioTags:   { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Profile updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id', auth, ctrl.updateArtist);

module.exports = router;
