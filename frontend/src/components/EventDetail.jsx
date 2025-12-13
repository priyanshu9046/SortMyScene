import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seatsAPI } from '../services/api';
import PaymentModal from './PaymentModal';
import './EventDetail.css';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [event, setEvent] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchSeats();
    checkExistingReservations(); // Check for existing reservations when component loads
    // Refresh seats every 5 seconds to get latest status
    const interval = setInterval(fetchSeats, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Check for existing active reservations when user returns
  const checkExistingReservations = async () => {
    try {
      const response = await seatsAPI.getMyReservations(eventId);
      if (response.success && response.reservations && response.reservations.length > 0) {
        // Get the most recent active reservation
        const activeReservation = response.reservations[0];
        setReservation({
          id: activeReservation.id,
          seatNumbers: activeReservation.seatNumbers,
          expiresAt: activeReservation.expiresAt,
        });
        setSelectedSeats(activeReservation.seatNumbers);
        // Calculate time left
        const now = new Date().getTime();
        const expiry = new Date(activeReservation.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(remaining);

        if (remaining > 0) {
          // Show a message that reservation was restored
          console.log('Active reservation restored');
        }
      }
    } catch {
      // Silently fail - user might not have any reservations
      console.log('No active reservations found');
    }
  };

  useEffect(() => {
    if (reservation && reservation.expiresAt) {
      // Calculate initial time left
      const now = new Date().getTime();
      const expiry = new Date(reservation.expiresAt).getTime();
      const initialRemaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(initialRemaining);

      const timer = setInterval(() => {
        const currentTime = new Date().getTime();
        const expiryTime = new Date(reservation.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));

        if (remaining === 0) {
          // Reservation expired
          alert('Reservation expired. Please reserve again.');
          setReservation(null);
          setSelectedSeats([]);
          setShowPaymentModal(false);
          fetchSeats();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation]);

  const fetchSeats = async () => {
    try {
      setError(null);
      const response = await seatsAPI.getSeatsByEvent(eventId);
      if (response.success) {
        setSeats(response.seats);
        setEvent(response.event);
      } else {
        setError('Failed to fetch seats');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading seats');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seatNumber, status) => {
    if (status === 'booked' || status === 'reserved') {
      return; // Can't select booked or reserved seats
    }

    if (reservation) {
      return; // Can't change selection while reservation is active
    }

    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setIsReserving(true);
    setError(null);

    try {
      const response = await seatsAPI.reserveSeats(eventId, selectedSeats);
      if (response.success) {
        setReservation(response.reservation);
        setTimeLeft(600); // 10 minutes = 600 seconds
        setShowPaymentModal(true); // Open payment modal after reservation
        await fetchSeats();
      } else {
        setError(response.message || 'Failed to reserve seats');
        if (response.conflictingSeats) {
          setSelectedSeats(prev => prev.filter(seat => !response.conflictingSeats.includes(seat)));
          await fetchSeats();
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error reserving seats';
      setError(errorMsg);
      if (err.response?.data?.conflictingSeats) {
        setSelectedSeats(prev =>
          prev.filter(seat => !err.response.data.conflictingSeats.includes(seat))
        );
        await fetchSeats();
      }
    } finally {
      setIsReserving(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!reservation) {
      return;
    }

    setIsBooking(true);
    setError(null);
    setShowPaymentModal(false);

    try {
      const response = await seatsAPI.confirmBooking(reservation.id);
      if (response.success) {
        alert('Payment successful! Booking confirmed.');
        setReservation(null);
        setSelectedSeats([]);
        await fetchSeats();
      } else {
        setError(response.message || 'Failed to confirm booking');
        setShowPaymentModal(true); // Reopen payment modal on error
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error confirming booking';
      setError(errorMsg);
      if (err.response?.status === 400 && errorMsg.includes('expired')) {
        // Reservation expired - clear everything and refresh
        alert('Reservation expired. Please reserve again.');
        setReservation(null);
        setSelectedSeats([]);
        setShowPaymentModal(false);
        await fetchSeats();
      } else if (err.response?.status === 400) {
        // Other 400 errors
        setShowPaymentModal(true); // Reopen payment modal on error
      } else {
        setShowPaymentModal(true); // Reopen payment modal on error
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this reservation? The seats will be released immediately.'
    );
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      const response = await seatsAPI.cancelReservation(reservation.id);
      if (response.success) {
        alert('Reservation canceled successfully. Seats are now available.');
        setReservation(null);
        setSelectedSeats([]);
        setShowPaymentModal(false);
        await fetchSeats();
      } else {
        setError(response.message || 'Failed to cancel reservation');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error canceling reservation';
      setError(errorMsg);
      if (err.response?.status === 404) {
        // Reservation not found - might have expired
        alert('Reservation not found. It may have expired.');
        setReservation(null);
        setSelectedSeats([]);
        await fetchSeats();
      }
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeatStatus = seat => {
    if (seat.status === 'booked') return 'booked';
    if (seat.status === 'reserved') return 'reserved';
    return 'available';
  };

  const getSeatClassName = seat => {
    const status = getSeatStatus(seat);
    const isSelected = selectedSeats.includes(seat.seatNumber);
    return `seat ${status} ${isSelected ? 'selected' : ''}`;
  };

  if (loading) {
    return (
      <div className="event-detail-container">
        <div className="loading-message">Loading seats...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="event-detail-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/events')} className="back-button">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-container">
      <div className="event-header">
        <button onClick={() => navigate('/events')} className="back-button">
          ← Back to Events
        </button>
        {event && (
          <div className="event-info">
            <h1>{event.name}</h1>
            <p className="event-venue">{event.venue}</p>
            <p className="event-date">
              {new Date(event.date).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {reservation && (
        <div className="reservation-banner">
          <div className="reservation-info">
            <span>Seats Reserved: {selectedSeats.join(', ')}</span>
            <span className="timer">Payment time remaining: {formatTime(timeLeft)}</span>
          </div>
          <div className="reservation-actions">
            <button
              onClick={handleCancelReservation}
              className="cancel-reservation-button"
              disabled={isBooking}
            >
              Cancel Reservation
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="confirm-booking-button"
              disabled={isBooking}
            >
              {isBooking ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {reservation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            if (!isBooking) {
              setShowPaymentModal(false);
            }
          }}
          onConfirm={handlePaymentConfirm}
          reservation={reservation}
          timeLeft={timeLeft}
          formatTime={formatTime}
        />
      )}

      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-seat available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat reserved"></div>
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat selected"></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="seat-grid">
        {seats.map(seat => (
          <button
            key={seat._id || seat.seatNumber}
            className={getSeatClassName(seat)}
            onClick={() => handleSeatClick(seat.seatNumber, getSeatStatus(seat))}
            disabled={
              getSeatStatus(seat) === 'booked' ||
              getSeatStatus(seat) === 'reserved' ||
              !!reservation
            }
            title={seat.seatNumber}
          >
            {seat.seatNumber}
          </button>
        ))}
      </div>

      {!reservation && (
        <div className="action-bar">
          <div className="selected-info">
            {selectedSeats.length > 0 ? (
              <span>
                Selected: {selectedSeats.join(', ')} ({selectedSeats.length} seat
                {selectedSeats.length > 1 ? 's' : ''})
              </span>
            ) : (
              <span>Select seats to reserve</span>
            )}
          </div>
          <button
            onClick={handleReserve}
            className="reserve-button"
            disabled={selectedSeats.length === 0 || isReserving}
          >
            {isReserving ? 'Reserving...' : 'Reserve Seats'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
