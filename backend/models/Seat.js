import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked'],
      default: 'available',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique seat numbers per event
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

const Seat = mongoose.model('Seat', seatSchema);

export default Seat;
