const Vehicle = require("../models/Vehicle.model");

class VehicleController {
  /**
   * Get driver's vehicles
   */
  static async getByDriver(req, res) {
    try {
      const userId = req.user.user_id;
      const vehicles = await Vehicle.findByDriver(userId);

      res.json({
        success: true,
        data: vehicles,
        count: vehicles.length,
      });
    } catch (error) {
      console.error("Get vehicles error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get vehicles",
        error: error.message,
      });
    }
  }

  /**
   * Get vehicle by ID
   */
  static async getById(req, res) {
    try {
      const { vehicleId } = req.params;
      const vehicle = await Vehicle.findById(vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      res.json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error("Get vehicle error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get vehicle",
        error: error.message,
      });
    }
  }

  /**
   * Register new vehicle
   */
  static async register(req, res) {
    try {
      const userId = req.user.user_id;
      const vehicleData = {
        ...req.body,
        driverID: userId,
      };

      const vehicleId = await Vehicle.create(vehicleData);

      const createdVehicle = await Vehicle.findById(vehicleId);

      res.status(201).json({
        success: true,
        message: "Vehicle registered successfully",
        data: createdVehicle,
      });
    } catch (error) {
      console.error("Register vehicle error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register vehicle",
        error: error.message,
      });
    }
  }

  /**
   * Update vehicle
   */
  static async update(req, res) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user.user_id;
      const updates = req.body;

      // Check ownership
      const belongs = await Vehicle.belongsToDriver(vehicleId, userId);
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const success = await Vehicle.update(vehicleId, updates);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "No updates made",
        });
      }

      const updatedVehicle = await Vehicle.findById(vehicleId);

      res.json({
        success: true,
        message: "Vehicle updated successfully",
        data: updatedVehicle,
      });
    } catch (error) {
      console.error("Update vehicle error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle",
        error: error.message,
      });
    }
  }

  /**
   * Delete vehicle
   */
  static async delete(req, res) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user.user_id;

      // Check ownership
      const belongs = await Vehicle.belongsToDriver(vehicleId, userId);
      if (!belongs) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      await Vehicle.delete(vehicleId);

      res.json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      console.error("Delete vehicle error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete vehicle",
        error: error.message,
      });
    }
  }
}

module.exports = VehicleController;
