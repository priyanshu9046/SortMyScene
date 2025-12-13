import express from 'express';
import eventController from '../controllers/eventController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All event routes require authentication
router.get('/', authenticate, eventController.getAllEventsController);
router.get('/:id', authenticate, eventController.getEventByIdController);

export default router;
