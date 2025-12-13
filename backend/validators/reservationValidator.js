import { z } from 'zod';

// Validation schema for reserving seats
export const reserveSeatsSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID format'),
  seatNumbers: z
    .array(z.string().min(1, 'Seat number cannot be empty'))
    .min(1, 'At least one seat must be selected')
    .max(20, 'Cannot reserve more than 20 seats at once'),
});

// Validation schema for confirming booking
export const confirmBookingSchema = z.object({
  reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reservation ID format'),
});

// Validation middleware
export const validateReserveSeats = (req, res, next) => {
  try {
    reserveSeatsSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

export const validateConfirmBooking = (req, res, next) => {
  try {
    confirmBookingSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};
