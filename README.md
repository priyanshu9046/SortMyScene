# BookTheShow

A ticket booking system I built for events. Users can browse events, select seats, reserve them for 10 minutes, and complete payment. Pretty standard booking flow but I tried to handle the edge cases properly.

## What it does

The app lets users register, login, and browse available events. When they pick an event, they see a seat grid showing which seats are available, reserved, or already booked. They can select multiple seats, reserve them for 10 minutes, and complete payment during that window. If they don't pay in time, the reservation expires and seats go back to available.

I also added some abuse prevention since people could just keep reserving seats without paying. There's rate limiting and some pattern detection to catch that.

## Tech Stack

Backend is Node.js with Express. Using MongoDB with Mongoose for the database. Authentication is JWT tokens stored in HTTP-only cookies. Frontend is React with Vite, using React Router for navigation.

## Getting Started

You'll need Node.js installed and a MongoDB instance running (local or cloud, doesn't matter).

### Backend Setup

First, go into the backend folder and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with these variables:

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/sortmyscene
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

The JWT_SECRET should be something random and secure. Don't use the example above.

To seed some sample events into the database:

```bash
npm run seed:events
```

Then start the server:

```bash
npm run dev
```

The backend runs on port 4000 by default. You should see "Connected to MongoDB" and "Server is running on port 4000" in the console.

### Frontend Setup

In a separate terminal, go to the frontend folder:

```bash
cd frontend
npm install
```

If you want to change the API URL, create a `.env` file:

```
VITE_API_URL=http://localhost:4000/api
```

Start the dev server:

```bash
npm run dev
```

Frontend runs on port 5173 by default. Open http://localhost:5173 in your browser.

## Project Structure

Backend follows a pretty standard MVC pattern with a service layer. Controllers handle HTTP requests, services contain the business logic, and models define the database schemas. Routes are separated by feature.

Frontend is component-based. I used Context API for global auth state since it's simple and works fine for this. Each component handles its own local state.

## Key Features

**Authentication**: JWT tokens in HTTP-only cookies. Passwords are hashed with bcrypt. Basic stuff but it works.

**Seat Reservation**: When users reserve seats, they get a 10-minute window to complete payment. The timer shows on the frontend and the backend validates expiry before allowing booking.

**Double Booking Prevention**: I check for conflicts before creating reservations and use atomic MongoDB operations when confirming bookings. Multiple validation layers to make sure seats don't get double-booked.

**Abuse Prevention**: Rate limiting on reservation endpoints (IP-based) and pattern detection that flags users with too many expired reservations. Also limits concurrent reservations per user.

**Reservation Restoration**: If a user navigates away and comes back, their active reservation is restored automatically. The timer picks up where it left off.

**Real-time Updates**: Seat grid refreshes every 5 seconds so users see the latest availability.

## API Endpoints

All endpoints are under `/api`.

**Auth**:
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

**Events**:
- GET `/api/events` - Get all events
- GET `/api/events/:id` - Get single event

**Seats/Reservations**:
- GET `/api/events/:eventId/seats` - Get seat grid with statuses
- GET `/api/events/:eventId/my-reservations` - Get user's active reservations
- POST `/api/reserve` - Reserve seats
- POST `/api/bookings` - Confirm booking
- POST `/api/cancel` - Cancel reservation

Most endpoints require authentication except register and login.

## Database Models

**User**: Stores username, email, and hashed password.

**Event**: Event details - name, date, venue, total seats. I don't store seat status here, it's derived from reservations.

**Reservation**: Tracks reservations and bookings. Has userId, eventId, seatNumbers array, expiresAt timestamp, and status (active, completed, expired). There's a TTL index that auto-expires active reservations after 10 minutes, but completed bookings are preserved.

## Design Decisions

I decided not to store seat status in the Event model. Instead, seat statuses are calculated dynamically from reservations. This keeps things simpler and avoids data duplication. The reservation model is the single source of truth.

For preventing double booking, I use multiple checks before creating reservations and atomic operations when confirming. Even if two users try to book the same seat at the same time, only one succeeds.

The abuse prevention is multi-layered. Rate limiting catches immediate spam, and pattern detection catches users who abuse the system over time. There's also a cooldown period after expired reservations.

## Code Quality

I set up ESLint and Prettier for both backend and frontend. Run `npm run lint` to check for issues and `npm run format` to format code. The configs are pretty standard.

## Things I'd Improve

If I had more time, I'd add:
- Proper payment integration (right now it's just simulated)
- Email notifications for bookings
- Admin panel to manage events
- Better error handling in some places
- Unit tests (I know, I should have written tests)
- WebSocket for real-time seat updates instead of polling

But for a demo project, it covers the main requirements and handles the edge cases reasonably well.

## Notes

The reservation expiry is handled by MongoDB TTL indexes. This means expired reservations are automatically cleaned up by the database. I used a partial TTL index so completed bookings aren't deleted.

The frontend timer is just for UX - the backend always validates expiry before allowing booking. So even if someone messes with the frontend timer, they can't book expired reservations.

Rate limiting uses express-rate-limit. It's IP-based and stored in memory, so it resets on server restart. For production you'd want to use Redis or something similar.

That's about it. If you have questions about any part of it, feel free to ask.

