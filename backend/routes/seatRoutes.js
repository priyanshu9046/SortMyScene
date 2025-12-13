import express from 'express';
import seatController from '../controllers/seatController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  validateReserveSeats,
  validateConfirmBooking,
} from '../validators/reservationValidator.js';
import { reservationRateLimiter, bookingRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All seat routes require authentication
router.get('/events/:eventId/seats', authenticate, seatController.getSeatsByEvent);
router.get('/events/:eventId/my-reservations', authenticate, seatController.getMyReservations);
router.post(
  '/reserve',
  reservationRateLimiter,
  authenticate,
  validateReserveSeats,
  seatController.reserveSeats
);
router.post(
  '/bookings',
  bookingRateLimiter,
  authenticate,
  validateConfirmBooking,
  seatController.confirmBooking
);
router.post(
  '/cancel',
  authenticate,
  validateConfirmBooking,
  seatController.cancelReservationController
);

export default router;
