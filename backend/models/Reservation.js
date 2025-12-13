import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    seatNumbers: {
      type: [String],
      required: [true, 'Seat numbers are required'],
      validate: {
        validator: function (seats) {
          return seats.length > 0;
        },
        message: 'At least one seat must be reserved',
      },
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reservationSchema.index({ eventId: 1, status: 1 }); // For getting seats by event
reservationSchema.index({ userId: 1, status: 1 }); // For user's reservations
reservationSchema.index({ eventId: 1, status: 1, seatNumbers: 1 }); // For conflict checking

// Partial TTL index: Only auto-delete expired reservations (not completed ones!)
// This ensures completed bookings are preserved permanently
reservationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: { $in: ['active', 'expired'] } },
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
