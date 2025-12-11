const Ride = require("../models/Ride.model");
const Vehicle = require("../models/Vehicle.model");

class RideController {
  /**
   * Create new ride (Driver only) - FIXED: No fare required
   */
  static async create(req, res) {
    try {
      const userId = req.user.user_id;
      const rideData = req.body;

      // Validation
      if (!rideData.startPoint || !rideData.endPoint) {
        return res.status(400).json({
          success: false,
          message: "Start point and end point are required",
        });
      }

      if (!rideData.departureTime || !rideData.availableSeats) {
        return res.status(400).json({
          success: false,
          message: "Departure time and available seats are required",
        });
      }

      // Get driver's vehicle
      const vehicle = await Vehicle.getActiveVehicle(userId);
      if (!vehicle) {
        return res.status(400).json({
          success: false,
          message: "You must have an active vehicle to create a ride",
        });
      }

      // Validate seats
      if (rideData.availableSeats > vehicle.seats_available) {
        return res.status(400).json({
          success: false,
          message: `Your vehicle only has ${vehicle.seats_available} seats`,
        });
      }

      // Validate departure time
      const departureDate = new Date(rideData.departureTime);
      if (departureDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Departure time must be in the future",
        });
      }

      // Create ride - NO farePerSeat or notes needed
      const completeRideData = {
        userID: userId,
        vehicleID: vehicle.vehicleID,
        startPoint: rideData.startPoint,
        endPoint: rideData.endPoint,
        departureTime: rideData.departureTime,
        estimatedArrivalTime: rideData.estimatedArrivalTime,
        availableSeats: parseInt(rideData.availableSeats),
        distance: rideData.distance,
        estimatedDurationMinutes: rideData.estimatedDurationMinutes,
      };

      const createdRide = await Ride.create(completeRideData);

      res.status(201).json({
        success: true,
        message: "Ride created successfully",
        data: createdRide,
      });
    } catch (error) {
      console.error("Create ride error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create ride",
        error: error.message,
      });
    }
  }

  /**
   * Get completed rides with stats (for history page)
   */
  static async getHistory(req, res) {
    try {
      const userId = req.user.user_id;
      const { sortOrder = 'DESC', search = '', limit = 10, offset = 0 } = req.query;

      // Fetch completed rides with booking details
      const rides = await Ride.getCompletedRidesWithBookings(
        userId,
        sortOrder,
        limit,
        offset
      );

      // Fetch driver stats
      const stats = await Ride.getDriverStats(userId);

      res.json({
        success: true,
        data: {
          rides,
          stats,
          count: rides.length
        }
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ride history',
        error: error.message
      });
    }
  }

  /**
   * Get rides by user
   */
  static async getByUser(req, res) {
    try {
      const userId = req.user.user_id;
      const { status } = req.query;

      const rides = await Ride.findByDriver(userId, status);

      res.json({
        success: true,
        data: rides,
        count: rides.length,
      });
    } catch (error) {
      console.error("Get rides error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get rides",
        error: error.message,
      });
    }
  }

  /**
   * Get active rides
   */
  static async getActive(req, res) {
    try {
      const userId = req.user.user_id;
      const rides = await Ride.getActiveRides(userId);

      res.json({
        success: true,
        data: rides,
        count: rides.length,
      });
    } catch (error) {
      console.error("Get active rides error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get active rides",
        error: error.message,
      });
    }
  }

  /**
   * Get ride by ID
   */
  static async getById(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.user_id;

      // Check ownership
      const belongs = await Ride.belongsToDriver(rideId, userId);
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: "Ride not found",
        });
      }

      res.json({
        success: true,
        data: ride,
      });
    } catch (error) {
      console.error("Get ride error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get ride",
        error: error.message,
      });
    }
  }

  /**
   * Update ride
   */
  static async update(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.user_id;
      const updates = req.body;

      // Check ownership
      const belongs = await Ride.belongsToDriver(rideId, userId);
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if ride can be updated
      const ride = await Ride.findById(rideId);
      if (
        ["completed", "cancelled", "driver_cancelled"].includes(ride.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Cannot update completed or cancelled ride",
        });
      }

      const success = await Ride.update(rideId, updates);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "No updates made",
        });
      }

      const updatedRide = await Ride.findById(rideId);

      res.json({
        success: true,
        message: "Ride updated successfully",
        data: updatedRide,
      });
    } catch (error) {
      console.error("Update ride error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update ride",
        error: error.message,
      });
    }
  }

  /**
   * Cancel ride
   */
  static async cancel(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.user_id;

      // Check ownership
      const belongs = await Ride.belongsToDriver(rideId, userId);
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if already cancelled
      const ride = await Ride.findById(rideId);
      if (
        ["completed", "cancelled", "driver_cancelled"].includes(ride.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Ride already completed or cancelled",
        });
      }

      await Ride.cancel(rideId, "driver_cancelled");

      res.json({
        success: true,
        message: "Ride cancelled successfully",
      });
    } catch (error) {
      console.error("Cancel ride error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel ride",
        error: error.message,
      });
    }
  }

  /**
   * Search rides (for passengers)
   */
  static async search(req, res) {
    try {
      const filters = {
        origin: req.query.origin,
        destination: req.query.destination,
        date: req.query.date,
      };

      const rides = await Ride.search(filters);

      res.json({
        success: true,
        data: rides,
        count: rides.length,
      });
    } catch (error) {
      console.error("Search rides error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search rides",
        error: error.message,
      });
    }
  }
}

module.exports = RideController;