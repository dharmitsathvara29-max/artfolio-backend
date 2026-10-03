const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const sendRules = [
  body('recipientId').isMongoId(),
  body('type').isIn(['new_comment', 'new_like', 'new_commission', 'sale_recorded']),
  body('message').trim().notEmpty()
];

router.post('/send',           auth, validate(sendRules), ctrl.sendNotification);
router.get('/my',              auth, ctrl.getMyNotifications);
router.put('/mark-all-read',   auth, ctrl.markAllAsRead);
router.put('/:id/read',        auth, ctrl.markAsRead);

module.exports = router;
