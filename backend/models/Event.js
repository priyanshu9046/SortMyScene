import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
    },
    //seat status is derived from reservations
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
eventSchema.index({ date: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
