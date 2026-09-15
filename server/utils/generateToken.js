import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for an authenticated user ID
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'korus_fallback_secret', {
    expiresIn: '7d',
  });
};

export default generateToken;
