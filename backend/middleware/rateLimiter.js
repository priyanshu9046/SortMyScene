import rateLimit from 'express-rate-limit';

// Rate limiter for reservation endpoint
export const reservationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 reservations per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many reservation attempts. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for booking endpoint
export const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 booking attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many booking attempts. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
