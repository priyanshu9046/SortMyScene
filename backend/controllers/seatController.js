import eventService from '../services/eventService.js';
import seatService from '../services/seatService.js';
import reservationService from '../services/reservationService.js';

class SeatController {
  async getMyReservations(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.userId;

      await eventService.validateEventExists(eventId);

      const reservations = await reservationService.getUserActiveReservations(userId, eventId);

      res.status(200).json({
        success: true,
        reservations,
      });
    } catch (error) {
      console.error('Get my reservations error:', error);

      if (error.message === 'Invalid event ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error fetching reservations',
        error: error.message,
      });
    }
  }

  async getSeatsByEvent(req, res) {
    try {
      const { eventId } = req.params;

      const event = await eventService.validateEventExists(eventId);

      await seatService.cleanupExpiredReservations(eventId);

      const seats = await seatService.getSeatStatuses(eventId, event.totalSeats);

      res.status(200).json({
        success: true,
        seats,
        event: {
          id: event._id,
          name: event.name,
          date: event.date,
          venue: event.venue,
          totalSeats: event.totalSeats,
        },
      });
    } catch (error) {
      console.error('Get seats error:', error);

      if (error.message === 'Invalid event ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error fetching seats',
        error: error.message,
      });
    }
  }

  async reserveSeats(req, res) {
    try {
      const { eventId, seatNumbers } = req.body;
      const userId = req.userId;

      const event = await eventService.validateEventExists(eventId);

      await seatService.cleanupExpiredReservations(eventId);

      await reservationService.canUserReserve(userId, eventId);

      seatService.validateSeatNumbers(seatNumbers, event.totalSeats);

      await seatService.checkSeatConflicts(eventId, seatNumbers);

      const reservation = await reservationService.createReservation(userId, eventId, seatNumbers);

      res.status(201).json({
        success: true,
        message: 'Seats reserved successfully',
        reservation,
      });
    } catch (error) {
      console.error('Reserve seats error:', error);

      if (error.type === 'ABUSE') {
        return res.status(429).json({
          success: false,
          message: error.message,
        });
      }

      if (error.type === 'CONFLICT') {
        return res.status(409).json({
          success: false,
          message: error.message,
          conflictingSeats: error.conflictingSeats || [],
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error reserving seats',
        error: error.message,
      });
    }
  }

  async confirmBooking(req, res) {
    try {
      const { reservationId } = req.body;
      const userId = req.userId;

      const reservation = await reservationService.getReservationById(reservationId);

      reservationService.verifyReservationOwnership(reservation, userId);

      reservationService.validateReservationForBooking(reservation);

      await reservationService.checkBookingConflicts(reservation);

      const booking = await reservationService.completeReservation(reservation);

      res.status(200).json({
        success: true,
        message: 'Booking confirmed successfully',
        booking,
      });
    } catch (error) {
      console.error('Confirm booking error:', error);

      if (error.type === 'UNAUTHORIZED') {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.type === 'EXPIRED') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.type === 'CONFLICT') {
        return res.status(409).json({
          success: false,
          message: error.message,
          conflictingSeats: error.conflictingSeats || [],
        });
      }

      if (error.message === 'Reservation not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error confirming booking',
        error: error.message,
      });
    }
  }

  async cancelReservationController(req, res) {
    try {
      const { reservationId } = req.body;
      const userId = req.userId;

      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: 'Reservation ID is required',
        });
      }

      const reservation = await reservationService.getReservationById(reservationId);

      reservationService.verifyReservationOwnership(reservation, userId);

      const result = await reservationService.cancelReservation(reservation);

      res.status(200).json({
        success: true,
        message: 'Reservation canceled successfully',
        canceledReservation: result,
      });
    } catch (error) {
      console.error('Cancel reservation error:', error);

      if (error.type === 'UNAUTHORIZED') {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.type === 'INVALID') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === 'Reservation not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error canceling reservation',
        error: error.message,
      });
    }
  }
}

const seatController = new SeatController();
export default seatController;
