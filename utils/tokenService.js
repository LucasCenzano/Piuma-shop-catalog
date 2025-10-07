const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/security');

function generateAccessToken(userData) {
  const payload = {
    id: userData.id,
    username: userData.username,
    role: userData.role
  };
  
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: 'piuma-admin',
    audience: 'piuma-api'
  });
}

function generateRefreshToken(userData) {
  return jwt.sign(
    { id: userData.id, type: 'refresh' },
    jwtConfig.secret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      issuer: 'piuma-admin',
      audience: 'piuma-api'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw error;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};