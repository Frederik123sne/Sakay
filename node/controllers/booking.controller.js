const Booking = require("../models/Booking.model");

class BookingController {
  /**
   * Create booking (Passenger only)
   */
  static async create(req, res) {
    try {
      const userId = req.user.user_id;
      const bookingData = req.body;

      // Validation
      if (
        !bookingData.rideID ||
        !bookingData.seats_booked ||
        !bookingData.total_fare
      ) {
        return res.status(400).json({
          success: false,
          message: "Ride ID, seats, and fare are required",
        });
      }

      // Check ride availability
      const ride = await Ride.findById(bookingData.rideID);
      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      if (ride.status !== "requested") {
        return res.status(400).json({
          success: false,
          message: "Ride is not available for booking",
        });
      }

      // Create booking
      const completeBookingData = {
        userID: userId,
        rideID: bookingData.rideID,
        seats_booked: bookingData.seats_booked,
        total_fare: bookingData.total_fare,
        pickup_location: bookingData.pickup_location,
        dropoff_location: bookingData.dropoff_location,
      };

      const createdBooking = await Booking.create(completeBookingData);

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: createdBooking,
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create booking",
        error: error.message,
      });
    }
  }

  /**
   * Get user bookings
   */
  static async getByUser(req, res) {
    try {
      const userId = req.user.user_id;
      const bookings = await Booking.findByPassenger(userId);

      res.json({
        success: true,
        data: bookings,
        count: bookings.length,
      });
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get bookings",
        error: error.message,
      });
    }
  }

  /**
   * Get booking by ID
   */
  static async getById(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.user_id;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if user owns this booking
      if (booking.userID !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get booking",
        error: error.message,
      });
    }
  }

  /**
   * Cancel booking
   */
  static async cancel(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.user_id;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (booking.userID !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      if (booking.booking_status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Booking already cancelled",
        });
      }

      await Booking.cancel(bookingId, "passenger_cancelled");

      res.json({
        success: true,
        message: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel booking",
        error: error.message,
      });
    }
  }
}

module.exports = BookingController;
