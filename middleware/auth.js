const jwt = require('jsonwebtoken');
const { admin, isInitialized } = require('../config/firebase');

/**
 * Middleware to authenticate requests using JWT or optional Firebase ID Token.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied: No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'artfolio_default_jwt_secret_dev_key';

    // 1. Attempt standard JWT verification
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // { id, role, ... }
      return next();
    } catch (jwtErr) {
      // 2. If JWT fails, attempt Firebase ID Token verification as fallback if initialized
      if (isInitialized()) {
        try {
          const decodedFirebase = await admin.auth().verifyIdToken(token);
          req.user = {
            id: decodedFirebase.uid,
            email: decodedFirebase.email,
            role: decodedFirebase.role || 'visitor',
            firebase: true
          };
          return next();
        } catch (firebaseErr) {
          // Both failed
          return res.status(401).json({
            success: false,
            message: 'Authorization denied: Invalid or expired token'
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Authorization denied: Invalid or expired token'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware:
 * Populates req.user if valid token provided, but continues without error if absent.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'artfolio_default_jwt_secret_dev_key';

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
    } catch (err) {
      // Silently ignore invalid token on optional auth
      req.user = undefined;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  auth,
  optionalAuth
};
