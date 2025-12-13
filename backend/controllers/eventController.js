import eventService from '../services/eventService.js';

class EventController {
  async getAllEventsController(req, res) {
    try {
      const result = await eventService.getAllEvents();

      res.status(200).json({
        success: true,
        count: result.count,
        events: result.events,
      });
    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching events',
        error: error.message,
      });
    }
  }

  async getEventByIdController(req, res) {
    try {
      const { id } = req.params;
      const event = await eventService.getEventById(id);

      res.status(200).json({
        success: true,
        event,
      });
    } catch (error) {
      console.error('Get event by ID error:', error);

      if (error.message === 'Invalid event ID format' || error.message === 'Event not found') {
        const statusCode = error.message === 'Event not found' ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error fetching event',
        error: error.message,
      });
    }
  }
}

const eventController = new EventController();
export default eventController;
