import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Middleware to protect routes - requires authentication
export const protect = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;
    console.log('🍪 Cookie received:', token ? 'Yes' : 'No');
    console.log('🍪 All cookies:', Object.keys(req.cookies).length > 0 ? Object.keys(req.cookies) : 'None');
    console.log('🌍 Origin:', req.headers.origin);
    console.log('🔒 Environment:', process.env.NODE_ENV);

    if (!token) {
      console.log('❌ No token in cookie');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    console.log('🔐 Token decoded:', decoded ? 'Valid' : 'Invalid');

    if (!decoded) {
      // console.log('❌ Token verification failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    // console.log('👤 User found:', user ? user.email : 'Not found');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Optional auth middleware - doesn't block if not authenticated
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};
