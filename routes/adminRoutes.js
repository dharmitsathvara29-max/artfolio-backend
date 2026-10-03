const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');

router.get('/artworks',       auth, checkRole('admin'), ctrl.getArtworksForModeration);
router.put('/moderate/:id',   auth, checkRole('admin'),
  validate([body('status').isIn(['pending', 'approved', 'rejected', 'featured'])]),
  ctrl.moderateArtwork
);

module.exports = router;
