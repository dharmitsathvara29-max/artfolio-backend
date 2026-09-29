const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  requestCommission,
  getAllCommissions,
  getArtistCommissions,
  updateCommissionStatus
} = require('../controllers/commissionController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const createCommissionValidation = [
  body('artistId').isMongoId().withMessage('Valid artistId is required'),
  body('description').trim().notEmpty().withMessage('Commission description is required'),
  body('budget').isNumeric().withMessage('Budget must be a positive number')
];

/**
 * @swagger
 * tags:
 *   name: Commissions
 *   description: Custom artwork requests and artist commissions
 */

/**
 * @swagger
 * /api/commissions:
 *   post:
 *     summary: Request a commission from an artist
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artistId
 *               - description
 *               - budget
 *             properties:
 *               artistId:
 *                 type: string
 *                 example: 64b8e3a2f1c8a1b2c3d4e5f6
 *               description:
 *                 type: string
 *                 example: Similar style for my home, oil style landscape
 *               budget:
 *                 type: number
 *                 example: 15000
 *     responses:
 *       201:
 *         description: Commission request created
 *       400:
 *         description: Validation error
 */
router.post('/', auth, validate(createCommissionValidation), requestCommission);

/**
 * @swagger
 * /api/commissions:
 *   get:
 *     summary: List all commissions (Admin/Requester)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of commissions
 */
router.get('/', auth, getAllCommissions);

/**
 * @swagger
 * /api/commissions/artist/{id}:
 *   get:
 *     summary: Commissions received by a specific artist
 *     tags: [Commissions]
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
 *         description: Commissions for the artist
 *       403:
 *         description: Forbidden
 */
router.get('/artist/:id', auth, getArtistCommissions);

/**
 * @swagger
 * /api/commissions/{id}/status:
 *   put:
 *     summary: Update commission status (Artist or Admin)
 *     tags: [Commissions]
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
 *                 enum: [pending, accepted, declined, completed]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id/status', auth, updateCommissionStatus);

module.exports = router;
