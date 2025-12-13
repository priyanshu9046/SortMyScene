import Reservation from '../models/Reservation.js';
import { checkAbusePattern } from '../middleware/abuseDetection.js';

class ReservationService {
  async getUserActiveReservations(userId, eventId) {
    const now = new Date();

    const activeReservations = await Reservation.find({
      userId,
      eventId,
      status: 'active',
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    return activeReservations.map(res => ({
      id: res._id,
      seatNumbers: res.seatNumbers,
      expiresAt: res.expiresAt,
      createdAt: res.createdAt,
    }));
  }

  async canUserReserve(userId, eventId) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const abuseCheck = await checkAbusePattern(userId, eventId);
    if (abuseCheck.isAbuse) {
      throw {
        type: 'ABUSE',
        message:
          'Reservation blocked due to suspicious activity. Please contact support if you believe this is an error.',
      };
    }

    const recentExpiredReservations = await Reservation.countDocuments({
      userId,
      eventId,
      status: 'expired',
      createdAt: { $gte: oneHourAgo },
    });

    if (recentExpiredReservations >= 3) {
      throw {
        type: 'ABUSE',
        message:
          'Too many expired reservations. Please wait before reserving again. This helps prevent seat blocking.',
      };
    }

    const activeUserReservations = await Reservation.countDocuments({
      userId,
      eventId,
      status: 'active',
      expiresAt: { $gt: now },
    });

    if (activeUserReservations >= 2) {
      throw {
        type: 'ABUSE',
        message:
          'You already have active reservations for this event. Please complete or wait for them to expire.',
      };
    }

    const lastExpiredReservation = await Reservation.findOne({
      userId,
      eventId,
      status: 'expired',
    }).sort({ expiresAt: -1 });

    if (lastExpiredReservation) {
      const cooldownPeriod = 2 * 60 * 1000;
      const timeSinceExpiry = now.getTime() - lastExpiredReservation.expiresAt.getTime();

      if (timeSinceExpiry < cooldownPeriod) {
        const remainingCooldown = Math.ceil((cooldownPeriod - timeSinceExpiry) / 1000);
        throw {
          type: 'ABUSE',
          message: `Please wait ${remainingCooldown} seconds before reserving again. This prevents seat blocking.`,
        };
      }
    }
  }

  async createReservation(userId, eventId, seatNumbers) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const reservation = new Reservation({
      userId,
      eventId,
      seatNumbers,
      expiresAt,
      status: 'active',
    });

    await reservation.save();

    return {
      id: reservation._id,
      seatNumbers: reservation.seatNumbers,
      expiresAt: reservation.expiresAt,
    };
  }

  async getReservationById(reservationId) {
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    return reservation;
  }

  verifyReservationOwnership(reservation, userId) {
    if (reservation.userId.toString() !== userId) {
      throw {
        type: 'UNAUTHORIZED',
        message: 'Unauthorized access to this reservation',
      };
    }
  }

  validateReservationForBooking(reservation) {
    const now = new Date();

    if (reservation.expiresAt < now) {
      throw {
        type: 'EXPIRED',
        message: 'Reservation expired. Please reserve again.',
      };
    }

    if (reservation.status !== 'active') {
      throw {
        type: 'EXPIRED',
        message: 'Reservation expired. Please reserve again.',
      };
    }
  }

  async checkBookingConflicts(reservation) {
    const now = new Date();

    const completedReservations = await Reservation.find({
      eventId: reservation.eventId,
      status: 'completed',
    });

    const bookedSeatsSet = new Set();
    completedReservations.forEach(res => {
      res.seatNumbers.forEach(seatNum => {
        bookedSeatsSet.add(seatNum);
      });
    });

    const bookedSeats = reservation.seatNumbers.filter(seatNum => bookedSeatsSet.has(seatNum));

    if (bookedSeats.length > 0) {
      throw {
        type: 'CONFLICT',
        message: 'Some seats have been booked by another user',
        conflictingSeats: bookedSeats,
      };
    }

    const conflictingReservations = await Reservation.find({
      _id: { $ne: reservation._id },
      eventId: reservation.eventId,
      status: 'active',
      expiresAt: { $gt: now },
      seatNumbers: { $in: reservation.seatNumbers },
    });

    if (conflictingReservations.length > 0) {
      throw {
        type: 'CONFLICT',
        message: 'Some seats are currently reserved by another user',
      };
    }

    const conflictingCompleted = await Reservation.findOne({
      eventId: reservation.eventId,
      status: 'completed',
      seatNumbers: { $in: reservation.seatNumbers },
      _id: { $ne: reservation._id },
    });

    if (conflictingCompleted) {
      const conflictSeats = reservation.seatNumbers.filter(seatNum =>
        conflictingCompleted.seatNumbers.includes(seatNum)
      );
      throw {
        type: 'CONFLICT',
        message: 'Some seats were booked by another user',
        conflictingSeats: conflictSeats,
      };
    }
  }

  async completeReservation(reservation) {
    const now = new Date();

    const updatedReservation = await Reservation.findOneAndUpdate(
      {
        _id: reservation._id,
        status: 'active',
        expiresAt: { $gt: now },
      },
      {
        $set: { status: 'completed' },
      },
      {
        new: true,
      }
    );

    if (!updatedReservation) {
      const currentReservation = await Reservation.findById(reservation._id);
      if (currentReservation && currentReservation.expiresAt < now) {
        throw {
          type: 'EXPIRED',
          message: 'Reservation expired. Please reserve again.',
        };
      }
      throw {
        type: 'CONFLICT',
        message: 'Reservation is no longer available for booking',
      };
    }

    return {
      reservationId: updatedReservation._id,
      seatNumbers: updatedReservation.seatNumbers,
      eventId: updatedReservation.eventId,
    };
  }

  async cancelReservation(reservation) {
    if (reservation.status !== 'active') {
      throw {
        type: 'INVALID',
        message: 'Only active reservations can be canceled',
      };
    }

    reservation.status = 'expired';
    await reservation.save();

    return {
      reservationId: reservation._id,
      seatNumbers: reservation.seatNumbers,
      eventId: reservation.eventId,
    };
  }
}

export default new ReservationService();
