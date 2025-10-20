import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/stats', eventController.getEventStats);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/today', eventController.getTodayEvents);
router.get('/tomorrow', eventController.getTomorrowEvents);
router.get('/completed', eventController.getCompletedEvents);
router.get('/live', eventController.getLiveEvents);
router.get('/date-range', eventController.getEventsByDateRange);
router.get('/grouped', eventController.getEventsGroupedByDate);
router.get('/:id', eventController.getEventById);

// Protected routes (Admin only - add admin middleware if needed)
router.post('/', protect, eventController.createEvent);
router.put('/:id', protect, eventController.updateEvent);
router.delete('/:id', protect, eventController.deleteEvent);
router.post('/fetch-ticketmaster', protect, eventController.fetchEventsFromTicketmaster);
router.post('/fetch-sports', protect, eventController.fetchSportsEventsFromAPI);

export default router;
