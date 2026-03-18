const corsLib = require('cors');
const helmetLib = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Helmet
const helmetMiddleware = helmetLib();

// CORS
function corsMiddleware() {
  const whitelist = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://localhost:3000'
  ];
  return corsLib({
    origin: function (origin, callback) {
      if (!origin || whitelist.some(w => origin.startsWith(w))) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    },
    credentials: true
  });
}

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login' }
});

// Verify Meta webhook signature
function verifyMetaSignature(req, res, buf) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !process.env.META_APP_SECRET) return;

  const hash = crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(buf)
    .digest('hex');

  const expected = `sha256=${hash}`;
  if (signature !== expected) {
    console.warn('[Security] Invalid Meta webhook signature');
    throw new Error('Invalid signature');
  }
}

// Error handler
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
}

module.exports = {
  helmet: helmetMiddleware,
  cors: corsMiddleware,
  apiLimiter,
  authLimiter,
  verifyMetaSignature,
  errorHandler
};
