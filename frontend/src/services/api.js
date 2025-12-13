import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, //cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API functions
export const authAPI = {
  register: async userData => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async credentials => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Events API functions
export const eventsAPI = {
  getAllEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getEventById: async eventId => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },
};

// Seats API functions
export const seatsAPI = {
  getSeatsByEvent: async eventId => {
    const response = await api.get(`/events/${eventId}/seats`);
    return response.data;
  },

  getMyReservations: async eventId => {
    const response = await api.get(`/events/${eventId}/my-reservations`);
    return response.data;
  },

  reserveSeats: async (eventId, seatNumbers) => {
    const response = await api.post('/reserve', {
      eventId,
      seatNumbers,
    });
    return response.data;
  },

  confirmBooking: async reservationId => {
    const response = await api.post('/bookings', {
      reservationId,
    });
    return response.data;
  },

  cancelReservation: async reservationId => {
    const response = await api.post('/cancel', {
      reservationId,
    });
    return response.data;
  },
};

export default api;
