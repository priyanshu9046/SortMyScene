import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI } from '../services/api';
import './EventsList.css';

const EventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsAPI.getAllEvents();
      if (response.success) {
        setEvents(response.events);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSelectEvent = eventId => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="events-container">
        <div className="loading-message">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchEvents} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="events-container">
      <div className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="app-title">BookTheShow</h1>
            <p className="app-subtitle">Your Gateway to Unforgettable Experiences</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="dashboard-button">
            Dashboard
          </button>
        </div>
      </div>
      <div className="events-header">
        <h2>Available Events</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>No events available at the moment.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event._id} className="event-card">
              <h2 className="event-name">{event.name}</h2>
              <div className="event-details">
                <div className="event-detail-item">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value">{formatDate(event.date)}</span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Venue:</span>
                  <span className="detail-value">{event.venue}</span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Total Seats:</span>
                  <span className="detail-value">{event.totalSeats}</span>
                </div>
              </div>
              <button className="select-event-button" onClick={() => handleSelectEvent(event._id)}>
                Select Event
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList;
