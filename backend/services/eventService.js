import Event from '../models/Event.js';
import mongoose from 'mongoose';

class EventService {
  async getAllEvents() {
    const events = await Event.find().sort({ date: 1 });
    return {
      count: events.length,
      events,
    };
  }

  async getEventById(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error('Invalid event ID format');
    }

    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  async validateEventExists(eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error('Invalid event ID format');
    }

    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }
}

export default new EventService();
