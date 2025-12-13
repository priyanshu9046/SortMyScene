import Reservation from '../models/Reservation.js';

/**
 * Check if user has suspicious reservation patterns
 * This helps detect users who repeatedly reserve and expire without booking
 */
export const checkAbusePattern = async (userId, eventId) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count expired reservations in last 24 hours
  const expiredCount = await Reservation.countDocuments({
    userId,
    eventId,
    status: 'expired',
    createdAt: { $gte: oneDayAgo },
  });

  // Count completed bookings in last 24 hours
  const completedCount = await Reservation.countDocuments({
    userId,
    eventId,
    status: 'completed',
    createdAt: { $gte: oneDayAgo },
  });

  // If user has more than 5 expired reservations and no completed bookings, flag as suspicious
  if (expiredCount > 5 && completedCount === 0) {
    return {
      isAbuse: true,
      reason: 'Too many expired reservations without any completed bookings',
    };
  }

  // If expired to completed ratio is very high (>3:1), flag as suspicious
  if (expiredCount > 0 && completedCount > 0 && expiredCount / completedCount > 3) {
    return {
      isAbuse: true,
      reason: 'High ratio of expired to completed reservations',
    };
  }

  return { isAbuse: false };
};

/**
 * Get user's reservation statistics for an event
 */
export const getUserReservationStats = async (userId, eventId) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [active, expired, completed] = await Promise.all([
    Reservation.countDocuments({
      userId,
      eventId,
      status: 'active',
      expiresAt: { $gt: now },
    }),
    Reservation.countDocuments({
      userId,
      eventId,
      status: 'expired',
      createdAt: { $gte: oneHourAgo },
    }),
    Reservation.countDocuments({
      userId,
      eventId,
      status: 'completed',
    }),
  ]);

  return { active, expired, completed };
};
