const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Artist = require('../models/Artist');

/**
 * Generate a JWT for a user
 * @param {object} user - User document
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || 'artfolio_default_jwt_secret_dev_key';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * @desc    Register a new user (Artist or Visitor)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, bio, profileImageUrl, portfolioTags } = req.body;

    // Check if user already exists
    const existingUser = await Artist.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Role assignment: default to 'visitor', allow 'artist' or 'visitor'.
    // Admin role cannot be self-assigned on registration
    const assignedRole = role === 'artist' ? 'artist' : 'visitor';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await Artist.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: assignedRole,
      bio: bio || '',
      profileImageUrl: profileImageUrl || '',
      portfolioTags: Array.isArray(portfolioTags) ? portfolioTags : []
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: newUser.bio,
        profileImageUrl: newUser.profileImageUrl,
        portfolioTags: newUser.portfolioTags
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await Artist.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        portfolioTags: user.portfolioTags
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    const user = await Artist.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
