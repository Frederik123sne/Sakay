// node/routes/passenger.routes.js
// Passenger routes - Maps URLs to controller methods

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const PassengerController = require('../controllers/passenger.controller');
const ContactController = require('../controllers/contact.controller');

// Apply authentication middleware to all passenger routes
router.use(verifyToken);
router.use(requireRole('passenger'));

// Profile routes
router.get('/profile', PassengerController.getProfile);
router.put('/profile', PassengerController.updateProfile);

// Ride search routes
router.get('/rides/search', PassengerController.searchRides);
router.get('/rides/:rideId', PassengerController.getRideDetails);

// Booking routes
router.post('/bookings', PassengerController.createBooking);
router.get('/bookings', PassengerController.getBookings);
router.get('/bookings/:bookingId', PassengerController.getBookingDetails);
router.put('/bookings/:bookingId/cancel', PassengerController.cancelBooking);

// Contact Us route
router.post('/contact', ContactController.submitMessage);

module.exports = router;