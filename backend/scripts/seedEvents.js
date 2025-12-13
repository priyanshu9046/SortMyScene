import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';

dotenv.config();

const events = [
  {
    name: 'Summer Music Festival 2024',
    date: new Date('2024-07-15T18:00:00'),
    venue: 'Central Park Amphitheater',
    totalSeats: 50,
  },
  {
    name: 'Tech Conference: Future of AI',
    date: new Date('2024-08-20T09:00:00'),
    venue: 'Convention Center Hall A',
    totalSeats: 120,
  },
  {
    name: 'Broadway Show: The Phantom of the Opera',
    date: new Date('2024-09-10T19:30:00'),
    venue: 'Majestic Theater',
    totalSeats: 16,
  },
  {
    name: 'Comedy Night with Stand-up Stars',
    date: new Date('2024-07-25T20:00:00'),
    venue: 'Laugh Factory',
    totalSeats: 300,
  },
  {
    name: 'Jazz Concert: Smooth Sounds',
    date: new Date('2024-08-05T19:00:00'),
    venue: 'Blue Note Jazz Club',
    totalSeats: 200,
  },
  {
    name: 'Sports Championship Finals',
    date: new Date('2024-09-01T15:00:00'),
    venue: 'Stadium Arena',
    totalSeats: 50,
  },
  {
    name: 'Art Exhibition Opening',
    date: new Date('2024-08-12T17:00:00'),
    venue: 'Modern Art Museum',
    totalSeats: 50,
  },
  {
    name: 'Food & Wine Festival',
    date: new Date('2024-08-30T12:00:00'),
    venue: 'Waterfront Park',
    totalSeats: 20,
  },
];

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing events (optional - comment out if you want to keep existing)
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Insert events
    const insertedEvents = await Event.insertMany(events);
    console.log(`Successfully seeded ${insertedEvents.length} events:`);

    insertedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} - ${event.venue} (${event.totalSeats} seats)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding events:', error);
    process.exit(1);
  }
};

seedEvents();
