const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/security');

const loginLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxAttempts,
  message: { 
    error: rateLimitConfig.message,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit excedido desde IP: ${req.ip}`);
    res.status(429).json({
      error: rateLimitConfig.message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    error: 'Demasiadas peticiones',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  loginLimiter,
  apiLimiter
};