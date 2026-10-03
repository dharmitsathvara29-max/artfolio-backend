const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/commentController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const rules = [
  body('artworkId').isMongoId(),
  body('text').trim().notEmpty()
];

router.post('/',             auth, validate(rules), ctrl.addComment);
router.get('/',              ctrl.getAllComments);
router.get('/artwork/:id',   ctrl.getCommentsByArtwork);

module.exports = router;
