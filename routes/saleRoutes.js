const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { recordSale, getAllSales, getArtistSales } = require('../controllers/saleController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');

const recordSaleValidation = [
  body('artworkId').isMongoId().withMessage('Valid artworkId is required'),
  body('buyerName').trim().notEmpty().withMessage('Buyer name is required'),
  body('buyerEmail').isEmail().withMessage('Valid buyer email is required'),
  body('amount').isNumeric().withMessage('Amount must be a numeric value'),
  body('saleType')
    .optional()
    .isIn(['print', 'original'])
    .withMessage("saleType must be either 'print' or 'original'")
];

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: E-commerce print sales and artist earnings analytics
 */

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Record a print or original sale (Artist or Admin)
 *     tags: [Sales]
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
 *               - buyerName
 *               - buyerEmail
 *               - amount
 *             properties:
 *               artworkId:
 *                 type: string
 *                 example: 64b8e3a2f1c8a1b2c3d4e5f6
 *               buyerName:
 *                 type: string
 *                 example: Ritu Sharma
 *               buyerEmail:
 *                 type: string
 *                 example: ritu@example.com
 *               amount:
 *                 type: number
 *                 example: 5000
 *               saleType:
 *                 type: string
 *                 enum: [print, original]
 *                 default: print
 *     responses:
 *       201:
 *         description: Sale recorded successfully
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  auth,
  checkRole('artist', 'admin'),
  validate(recordSaleValidation),
  recordSale
);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: List all sales (Admin only)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 *       403:
 *         description: Forbidden
 */
router.get('/', auth, checkRole('admin'), getAllSales);

/**
 * @swagger
 * /api/sales/artist/{id}:
 *   get:
 *     summary: Sales and earnings analytics for a specific artist
 *     tags: [Sales]
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
 *         description: Artist sales and revenue metrics
 *       403:
 *         description: Forbidden
 */
router.get('/artist/:id', auth, getArtistSales);

module.exports = router;
