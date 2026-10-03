const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/artworkController');
const { auth, optionalAuth } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').optional().isNumeric()
];

router.get('/',    optionalAuth, ctrl.getArtworks);
router.get('/:id', ctrl.getArtworkById);
router.post('/',   auth, checkRole('artist'), upload.single('image'), validate(createRules), ctrl.createArtwork);
router.put('/:id', auth, upload.single('image'), ctrl.updateArtwork);
router.delete('/:id', auth, ctrl.deleteArtwork);

module.exports = router;
