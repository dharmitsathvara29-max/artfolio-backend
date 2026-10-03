const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').optional().isIn(['artist', 'visitor'])
];
const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration and authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (artist or visitor)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:        { type: string, example: Maya Lin }
 *               email:       { type: string, example: maya@artfolio.com }
 *               password:    { type: string, example: Password123! }
 *               role:        { type: string, enum: [artist, visitor], default: visitor }
 *               bio:         { type: string, example: Digital landscape artist }
 *               portfolioTags: { type: array, items: { type: string }, example: [landscape, digital] }
 *     responses:
 *       201:
 *         description: Registered successfully — returns JWT token
 *       400:
 *         description: Validation error or email already registered
 */
router.post('/register', validate(registerRules), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: maya@artfolio.com }
 *               password: { type: string, example: Password123! }
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', validate(loginRules), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', auth, getMe);

module.exports = router;
