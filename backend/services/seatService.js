import Reservation from '../models/Reservation.js';

class SeatService {
  async cleanupExpiredReservations(eventId) {
    const now = new Date();

    const expiredReservations = await Reservation.find({
      eventId,
      status: 'active',
      expiresAt: { $lt: now },
    });

    if (expiredReservations.length > 0) {
      await Reservation.updateMany(
        {
          eventId,
          status: 'active',
          expiresAt: { $lt: now },
        },
        {
          $set: { status: 'expired' },
        }
      );
    }
  }

  async getSeatStatuses(eventId, totalSeats) {
    const now = new Date();

    const [activeReservations, completedReservations] = await Promise.all([
      Reservation.find({
        eventId,
        status: 'active',
        expiresAt: { $gt: now },
      }),
      Reservation.find({
        eventId,
        status: 'completed',
      }),
    ]);

    const reservedSeatNumbers = new Set();
    activeReservations.forEach(reservation => {
      reservation.seatNumbers.forEach(seatNum => {
        reservedSeatNumbers.add(seatNum);
      });
    });

    const bookedSeatsSet = new Set();
    completedReservations.forEach(reservation => {
      reservation.seatNumbers.forEach(seatNum => {
        bookedSeatsSet.add(seatNum);
      });
    });

    const seatsArray = [];
    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = `A${i}`;
      let status;

      if (bookedSeatsSet.has(seatNumber)) {
        status = 'booked';
      } else if (reservedSeatNumbers.has(seatNumber)) {
        status = 'reserved';
      } else {
        status = 'available';
      }

      seatsArray.push({
        seatNumber,
        status,
        _id: `${eventId}-${seatNumber}`,
      });
    }

    return seatsArray;
  }

  validateSeatNumbers(seatNumbers, totalSeats) {
    const invalidSeats = seatNumbers.filter(seatNum => {
      const seatIndex = parseInt(seatNum.replace('A', ''));
      return isNaN(seatIndex) || seatIndex < 1 || seatIndex > totalSeats;
    });

    if (invalidSeats.length > 0) {
      throw new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}`);
    }
  }

  async checkSeatConflicts(eventId, seatNumbers) {
    const now = new Date();

    const completedReservations = await Reservation.find({
      eventId,
      status: 'completed',
    });

    const bookedSeatsSet = new Set();
    completedReservations.forEach(reservation => {
      reservation.seatNumbers.forEach(seatNum => {
        bookedSeatsSet.add(seatNum);
      });
    });

    const bookedSeats = seatNumbers.filter(seatNum => bookedSeatsSet.has(seatNum));

    if (bookedSeats.length > 0) {
      throw {
        type: 'CONFLICT',
        message: 'Some seats are no longer available',
        conflictingSeats: bookedSeats,
      };
    }

    const activeReservations = await Reservation.find({
      eventId,
      status: 'active',
      expiresAt: { $gt: now },
      seatNumbers: { $in: seatNumbers },
    });

    const reservedSeats = new Set();
    activeReservations.forEach(res => {
      res.seatNumbers.forEach(seat => reservedSeats.add(seat));
    });

    const reservedConflicts = seatNumbers.filter(seatNum => reservedSeats.has(seatNum));
    if (reservedConflicts.length > 0) {
      throw {
        type: 'CONFLICT',
        message: 'Some seats are no longer available',
        conflictingSeats: reservedConflicts,
      };
    }
  }
}

export default new SeatService();
