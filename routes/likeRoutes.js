const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/likeController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/',      auth, validate([body('artworkId').isMongoId()]), ctrl.addLike);
router.get('/',       ctrl.getLikes);
router.delete('/:id', auth, ctrl.removeLike);

module.exports = router;
