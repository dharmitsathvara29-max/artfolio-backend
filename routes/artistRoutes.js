const router = require('express').Router();
const ctrl = require('../controllers/artistController');
const { auth } = require('../middleware/auth');

router.get('/',     ctrl.getArtists);
router.get('/:id',  ctrl.getArtistById);
router.put('/:id',  auth, ctrl.updateArtist);

module.exports = router;
