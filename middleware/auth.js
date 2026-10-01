const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests using JWT.
 * Attaches decoded { id, role, email, name } to req.user.
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

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // { id, role, email, name }
      return next();
    } catch (jwtErr) {
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
 * Optional auth middleware — populates req.user if valid token is present,
 * but does NOT block the request if the token is absent or invalid.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'artfolio_default_jwt_secret_dev_key';

    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch {
      req.user = undefined;
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { auth, optionalAuth };
