const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/commissionController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Commissions
 *   description: Custom artwork commission requests
 */

/**
 * @swagger
 * /api/commissions:
 *   post:
 *     summary: Request a custom commission from an artist
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [artistId, description, budget]
 *             properties:
 *               artistId:    { type: string, example: 507f1f77bcf86cd799439011 }
 *               description: { type: string, example: A portrait of my dog in cyberpunk style }
 *               budget:      { type: number, example: 3000 }
 *     responses:
 *       201:
 *         description: Commission request sent
 *       404:
 *         description: Artist not found
 */
router.post('/', auth, validate([
  body('artistId').isMongoId(),
  body('description').trim().notEmpty(),
  body('budget').isNumeric()
]), ctrl.requestCommission);

/**
 * @swagger
 * /api/commissions:
 *   get:
 *     summary: Get my commissions (requester sees their own; admin sees all)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of commissions
 */
router.get('/', auth, ctrl.getAllCommissions);

/**
 * @swagger
 * /api/commissions/artist/{id}:
 *   get:
 *     summary: Get commissions received by a specific artist
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Artist's incoming commissions
 *       403:
 *         description: Forbidden
 */
router.get('/artist/:id', auth, ctrl.getArtistCommissions);

/**
 * @swagger
 * /api/commissions/{id}/status:
 *   put:
 *     summary: Update commission status (Artist only)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, accepted, declined, completed] }
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id/status', auth, ctrl.updateCommissionStatus);

module.exports = router;
