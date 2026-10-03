const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Artist = require('../models/Artist');

const signToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET || 'artfolio_dev_secret',
  { expiresIn: '7d' }
);

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, bio, profileImageUrl, portfolioTags } = req.body;
    if (await Artist.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await Artist.create({
      name, email: email.toLowerCase(), passwordHash,
      role: role === 'artist' ? 'artist' : 'visitor',
      bio: bio || '', profileImageUrl: profileImageUrl || '',
      portfolioTags: Array.isArray(portfolioTags) ? portfolioTags : []
    });

    res.status(201).json({ success: true, token: signToken(user), user });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Artist.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.isValidPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.json({ success: true, token: signToken(user), user });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await Artist.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
