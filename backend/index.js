import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import seatRoutes from './routes/seatRoutes.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', seatRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });
