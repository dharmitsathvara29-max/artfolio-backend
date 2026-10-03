const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/saleController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');

const createRules = [
  body('artworkId').isMongoId(),
  body('buyerName').trim().notEmpty(),
  body('buyerEmail').isEmail(),
  body('amount').isNumeric(),
  body('saleType').optional().isIn(['print', 'original'])
];

router.post('/',           auth, checkRole('artist', 'admin'), validate(createRules), ctrl.recordSale);
router.get('/',            auth, checkRole('admin'), ctrl.getAllSales);
router.get('/artist/:id',  auth, ctrl.getArtistSales);

module.exports = router;
