// node/controllers/passenger.controller.js
// Passenger Controller - Business logic for passenger operations

const User = require('../models/User.model');
const Ride = require('../models/Ride.model');
const Booking = require('../models/Booking.model');

class PassengerController {
    /**
     * Get passenger profile
     */
    static async getProfile(req, res) {
        try {
            const passengerId = req.user.user_id;

            const profile = await User.getProfileWithRole(passengerId, 'passenger');

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Passenger profile not found'
                });
            }

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Update passenger profile
     */
    static async updateProfile(req, res) {
        try {
            const passengerId = req.user.user_id;
            const updates = req.body;

            const success = await User.update(passengerId, updates);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Search available rides
     */
    static async searchRides(req, res) {
        try {
            const { origin, destination, date } = req.query;

            const rides = await Ride.search({ origin, destination, date });

            res.json({
                success: true,
                data: rides,
                count: rides.length
            });
        } catch (error) {
            console.error('Error in searchRides:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Get ride details
     */
    static async getRideDetails(req, res) {
        try {
            const { rideId } = req.params;

            const ride = await Ride.findById(rideId);

            if (!ride) {
                return res.status(404).json({
                    success: false,
                    message: 'Ride not found'
                });
            }

            res.json({
                success: true,
                data: ride
            });
        } catch (error) {
            console.error('Error in getRideDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Create a booking
     */
    static async createBooking(req, res) {
        try {
            const passengerId = req.user.user_id;
            const { rideID, seats_booked, pickup_location, dropoff_location } = req.body;

            // Validation
            if (!rideID || !seats_booked) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Check ride availability
            const ride = await Ride.findById(rideID);

            if (!ride) {
                return res.status(404).json({
                    success: false,
                    message: 'Ride not found'
                });
            }

            if (ride.status !== 'requested') {
                return res.status(400).json({
                    success: false,
                    message: 'Ride is no longer available'
                });
            }

            if (ride.total_seats < seats_booked) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${ride.total_seats} seats available`
                });
            }

            // Create booking
            const result = await Booking.create({
                rideID,
                userID: passengerId,
                seats_booked,
                pickup_location,
                dropoff_location
            });

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in createBooking:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Get passenger's bookings
     */
    static async getBookings(req, res) {
        try {
            const passengerId = req.user.user_id;

            const bookings = await Booking.findByPassenger(passengerId);

            res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            console.error('Error in getBookings:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Get booking details
     */
    static async getBookingDetails(req, res) {
        try {
            const passengerId = req.user.user_id;
            const { bookingId } = req.params;

            // Check ownership
            const belongs = await Booking.belongsToPassenger(bookingId, passengerId);
            if (!belongs) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            res.json({
                success: true,
                data: booking
            });
        } catch (error) {
            console.error('Error in getBookingDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }

    /**
     * Cancel booking
     */
    static async cancelBooking(req, res) {
        try {
            const passengerId = req.user.user_id;
            const { bookingId } = req.params;

            const success = await Booking.cancel(bookingId, passengerId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            res.json({
                success: true,
                message: 'Booking cancelled successfully'
            });
        } catch (error) {
            console.error('Error in cancelBooking:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
}

module.exports = PassengerController;