const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/saleController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Artwork sale records and earnings analytics
 */

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Record an artwork sale (Artist or Admin)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [artworkId, buyerName, buyerEmail, amount]
 *             properties:
 *               artworkId:  { type: string, example: 507f1f77bcf86cd799439011 }
 *               buyerName:  { type: string, example: Riya Sharma }
 *               buyerEmail: { type: string, example: riya@gmail.com }
 *               amount:     { type: number, example: 5000 }
 *               saleType:   { type: string, enum: [print, original], default: print }
 *     responses:
 *       201:
 *         description: Sale recorded
 *       403:
 *         description: Only artists and admins can record sales
 */
router.post('/', auth, checkRole('artist', 'admin'), validate([
  body('artworkId').isMongoId(),
  body('buyerName').trim().notEmpty(),
  body('buyerEmail').isEmail(),
  body('amount').isNumeric(),
  body('saleType').optional().isIn(['print', 'original'])
]), ctrl.recordSale);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales (Admin only)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sale records
 *       403:
 *         description: Admin only
 */
router.get('/', auth, checkRole('admin'), ctrl.getAllSales);

/**
 * @swagger
 * /api/sales/artist/{id}:
 *   get:
 *     summary: Get sales and earnings analytics for an artist
 *     tags: [Sales]
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
 *         description: Sales list + analytics (total/monthly earnings)
 *       403:
 *         description: Forbidden
 */
router.get('/artist/:id', auth, ctrl.getArtistSales);

module.exports = router;
