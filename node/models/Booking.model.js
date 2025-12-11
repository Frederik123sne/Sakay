// node/models/Booking.model.js
// Booking Model - Handles booking database operations

const db = require('../config/database');

class Booking {
    /**
     * Generate new booking ID
     * @returns {Promise<string>}
     */
    static async generateBookingId() {
        try {
            const [rows] = await db.query(
                'SELECT bookingID FROM bookings ORDER BY bookingID DESC LIMIT 1'
            );

            if (rows.length === 0) {
                return 'B001';
            }

            const lastId = rows[0].bookingID;
            const number = parseInt(lastId.substring(1)) + 1;
            return 'B' + number.toString().padStart(3, '0');
        } catch (error) {
            console.error('Error generating booking ID:', error);
            throw error;
        }
    }

    /**
     * Create a new booking
     * @param {Object} bookingData
     * @returns {Promise<Object>} { bookingId, totalFare }
     */
    static async create(bookingData) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Generate booking ID
            const bookingId = await this.generateBookingId();

            // Calculate total fare
            const farePerSeat = 50; // Base fare - should come from system settings
            const totalFare = farePerSeat * bookingData.seats_booked;

            // Create booking
            await connection.query(
                `INSERT INTO bookings 
         (bookingID, rideID, userID, seats_booked, total_fare, 
          pickup_location, dropoff_location, payment_status, booking_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'requested')`,
                [
                    bookingId,
                    bookingData.rideID,
                    bookingData.userID,
                    bookingData.seats_booked,
                    totalFare,
                    bookingData.pickup_location,
                    bookingData.dropoff_location
                ]
            );

            // Update available seats in ride (decrease)
            await connection.query(
                'UPDATE rides SET total_seats = total_seats - ? WHERE rideID = ?',
                [bookingData.seats_booked, bookingData.rideID]
            );

            await connection.commit();
            connection.release();

            return { bookingId, totalFare };
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error creating booking:', error);
            throw error;
        }
    }

    /**
     * Find bookings by passenger
     * @param {string} passengerId
     * @returns {Promise<Array>}
     */
    static async findByPassenger(passengerId) {
        try {
            const [rows] = await db.query(
                `SELECT b.*, 
                r.origin, r.destination, r.departure_time, r.status as ride_status,
                u.first_name as driver_first_name, 
                u.last_name as driver_last_name,
                u.phone as driver_phone,
                v.brand, v.model, v.plate_number
         FROM bookings b
         LEFT JOIN rides r ON b.rideID = r.rideID
         LEFT JOIN users u ON r.userID = u.userID
         LEFT JOIN vehicles v ON r.vehicleID = v.vehicleID
         WHERE b.userID = ?
         ORDER BY b.created_at DESC`,
                [passengerId]
            );
            return rows;
        } catch (error) {
            console.error('Error finding bookings by passenger:', error);
            throw error;
        }
    }

    /**
     * Find booking by ID
     * @param {string} bookingId
     * @returns {Promise<Object|null>}
     */
    static async findById(bookingId) {
        try {
            const [rows] = await db.query(
                `SELECT b.*, 
                r.origin, r.destination, r.departure_time,
                u.first_name as driver_first_name, 
                u.last_name as driver_last_name
         FROM bookings b
         LEFT JOIN rides r ON b.rideID = r.rideID
         LEFT JOIN users u ON r.userID = u.userID
         WHERE b.bookingID = ?`,
                [bookingId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error finding booking by ID:', error);
            throw error;
        }
    }

    /**
     * Cancel booking
     * @param {string} bookingId
     * @param {string} passengerId
     * @returns {Promise<boolean>}
     */
    static async cancel(bookingId, passengerId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Get booking details
            const [bookings] = await connection.query(
                'SELECT * FROM bookings WHERE bookingID = ? AND userID = ?',
                [bookingId, passengerId]
            );

            if (bookings.length === 0) {
                await connection.rollback();
                connection.release();
                return false;
            }

            const booking = bookings[0];

            // Update booking status
            await connection.query(
                `UPDATE bookings 
         SET booking_status = 'passenger_cancelled' 
         WHERE bookingID = ?`,
                [bookingId]
            );

            // Return seats to ride
            await connection.query(
                'UPDATE rides SET total_seats = total_seats + ? WHERE rideID = ?',
                [booking.seats_booked, booking.rideID]
            );

            await connection.commit();
            connection.release();

            return true;
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error cancelling booking:', error);
            throw error;
        }
    }

    /**
     * Check if booking belongs to passenger
     * @param {string} bookingId
     * @param {string} passengerId
     * @returns {Promise<boolean>}
     */
    static async belongsToPassenger(bookingId, passengerId) {
        try {
            const [rows] = await db.query(
                'SELECT 1 FROM bookings WHERE bookingID = ? AND userID = ?',
                [bookingId, passengerId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error checking booking ownership:', error);
            throw error;
        }
    }

    /**
     * Update booking status
     * @param {string} bookingId
     * @param {string} status
     * @returns {Promise<boolean>}
     */
    static async updateStatus(bookingId, status) {
        try {
            const [result] = await db.query(
                'UPDATE bookings SET booking_status = ? WHERE bookingID = ?',
                [status, bookingId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating booking status:', error);
            throw error;
        }
    }
}

module.exports = Booking;