/**
 * Middleware factory for role-based authorization.
 * @param {...string} allowedRoles - Roles allowed to access the route ('artist', 'visitor', 'admin')
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role(s)`
      });
    }

    next();
  };
};

module.exports = checkRole;
