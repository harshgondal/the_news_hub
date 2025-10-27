import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Generate JWT token
export const generateToken = (userId, email) => {
  return jwt.sign(
    { 
      id: userId, 
      email: email 
    },
    JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Set JWT cookie
export const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // true in production (HTTPS), false in development
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
  
  console.log('🍪 Setting cookie with options:', cookieOptions);
  console.log('🍪 Environment:', process.env.NODE_ENV);
  console.log('🍪 Token length:', token.length);
  res.cookie('token', token, cookieOptions);
};

// Clear JWT cookie
export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/'
  });
  console.log('🍪 Cookie cleared');
};
