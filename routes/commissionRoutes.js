const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/commissionController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const createRules = [
  body('artistId').isMongoId(),
  body('description').trim().notEmpty(),
  body('budget').isNumeric()
];

router.post('/',              auth, validate(createRules), ctrl.requestCommission);
router.get('/',               auth, ctrl.getAllCommissions);
router.get('/artist/:id',     auth, ctrl.getArtistCommissions);
router.put('/:id/status',     auth, ctrl.updateCommissionStatus);

module.exports = router;
