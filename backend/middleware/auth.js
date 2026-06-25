const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ksj_secret_auth_token_for_pharmacy_2026');

    if (decoded.type === 'employee') {
      req.user = await Employee.findById(decoded.id).select('-password');
      req.userType = 'employee';
    } else {
      req.user = await User.findById(decoded.id).select('-password');
      req.userType = 'user';
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User/Employee no longer exists' });
    }

    if (req.user.isBlocked || req.user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account is blocked or deactivated' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this route`
      });
    }
    next();
  };
};

// Check specific employee permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.userType !== 'employee') {
      return res.status(403).json({ success: false, message: 'Access denied: Customer cannot perform employee actions' });
    }
    // Admins bypass all permission checks
    if (req.user.role === 'Admin') {
      return next();
    }
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Missing required permission: ${permission}`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
  checkPermission
};
