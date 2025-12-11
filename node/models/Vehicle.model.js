// node/models/Vehicle.model.js
// FIXED: Clean Vehicle ID generation (V001, V002, etc.)

const db = require("../config/database");

class Vehicle {
  /**
   * Generate new vehicle ID - FIXED to return clean IDs like V001, V002
   * @returns {Promise<string>}
   */
  static async generateVehicleId() {
    try {
      // Get the last vehicle ID, ordering by the numeric part
      const [rows] = await db.query(
        `SELECT vehicleID FROM vehicles 
                 WHERE vehicleID REGEXP '^V[0-9]+$'
                 ORDER BY CAST(SUBSTRING(vehicleID, 2) AS UNSIGNED) DESC 
                 LIMIT 1`
      );

      if (rows.length === 0) {
        return "V001";
      }

      const lastId = rows[0].vehicleID;
      // Extract the number part (e.g., "V005" -> 5)
      const number = parseInt(lastId.substring(1)) + 1;
      // Return formatted ID (e.g., "V006")
      return "V" + number.toString().padStart(3, "0");
    } catch (error) {
      console.error("Error generating vehicle ID:", error);
      throw error;
    }
  }

  /**
   * Find all vehicles for a driver
   * @param {string} driverId
   * @returns {Promise<Array>}
   */
  static async findByDriver(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT 
                    vehicleID,
                    driverID,
                    brand,
                    model,
                    plate_number,
                    color,
                    year,
                    seats_available,
                    OR_CR,
                    vehicle_status,
                    verified_by,
                    verified_at,
                    created_at,
                    updated_at
                FROM vehicles 
                WHERE driverID = ?
                ORDER BY created_at DESC`,
        [driverId]
      );
      return rows;
    } catch (error) {
      console.error("Error finding vehicles by driver:", error);
      throw error;
    }
  }

  /**
   * Find vehicle by ID
   * @param {string} vehicleId
   * @returns {Promise<Object|null>}
   */
  static async findById(vehicleId) {
    try {
      const [rows] = await db.query(
        `SELECT 
                    v.*,
                    u.first_name,
                    u.last_name,
                    d.license_number
                FROM vehicles v
                JOIN driver d ON v.driverID = d.driverID
                JOIN users u ON d.driverID = u.userID
                WHERE v.vehicleID = ?`,
        [vehicleId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error finding vehicle by ID:", error);
      throw error;
    }
  }

  /**
   * Get driver's active vehicle
   * @param {string} driverId
   * @returns {Promise<Object|null>}
   */
  static async getActiveVehicle(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT 
                    vehicleID,
                    brand,
                    model,
                    plate_number,
                    color,
                    year,
                    seats_available,
                    vehicle_status
                FROM vehicles 
                WHERE driverID = ? 
                AND vehicle_status = 'active'
                ORDER BY created_at DESC 
                LIMIT 1`,
        [driverId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error getting active vehicle:", error);
      throw error;
    }
  }

  /**
   * Create new vehicle
   * @param {Object} vehicleData
   * @returns {Promise<string>} vehicleID
   */
  static async create(vehicleData) {
    try {
      // Generate clean vehicle ID (V001, V002, etc.)
      const vehicleId = await this.generateVehicleId();

      console.log("🚗 Creating vehicle with ID:", vehicleId);

      await db.query(
        `INSERT INTO vehicles (
                    vehicleID,
                    driverID,
                    brand,
                    model,
                    plate_number,
                    color,
                    year,
                    seats_available,
                    OR_CR,
                    vehicle_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          vehicleId,
          vehicleData.driverID,
          vehicleData.brand,
          vehicleData.model,
          vehicleData.plate_number,
          vehicleData.color,
          vehicleData.year,
          vehicleData.seats_available,
          vehicleData.OR_CR,
        ]
      );

      console.log("Vehicle created:", vehicleId);
      return vehicleId;
    } catch (error) {
      console.error("Error creating vehicle:", error);
      throw error;
    }
  }

  /**
   * Update vehicle
   * @param {string} vehicleId
   * @param {Object} updates
   * @returns {Promise<boolean>}
   */
  static async update(vehicleId, updates) {
    try {
      const allowedFields = [
        "brand",
        "model",
        "plate_number",
        "color",
        "year",
        "seats_available",
        "OR_CR",
        "vehicle_status",
      ];

      const updateFields = [];
      const values = [];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }

      if (updateFields.length === 0) {
        return false;
      }

      values.push(vehicleId);

      const [result] = await db.query(
        `UPDATE vehicles SET ${updateFields.join(
          ", "
        )}, updated_at = NOW() WHERE vehicleID = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating vehicle:", error);
      throw error;
    }
  }

  /**
   * Delete vehicle
   * @param {string} vehicleId
   * @returns {Promise<boolean>}
   */
  static async delete(vehicleId) {
    try {
      const [result] = await db.query(
        "DELETE FROM vehicles WHERE vehicleID = ?",
        [vehicleId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  }

  /**
   * Check if vehicle belongs to driver
   * @param {string} vehicleId
   * @param {string} driverId
   * @returns {Promise<boolean>}
   */
  static async belongsToDriver(vehicleId, driverId) {
    try {
      const [rows] = await db.query(
        "SELECT 1 FROM vehicles WHERE vehicleID = ? AND driverID = ?",
        [vehicleId, driverId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking vehicle ownership:", error);
      throw error;
    }
  }

  /**
   * Get vehicle statistics
   * @param {string} vehicleId
   * @returns {Promise<Object>}
   */
  static async getStats(vehicleId) {
    try {
      const [rows] = await db.query(
        `SELECT 
                    COUNT(r.rideID) as total_rides,
                    SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_rides,
                    SUM(CASE WHEN r.status IN ('cancelled', 'driver_cancelled') THEN 1 ELSE 0 END) as cancelled_rides
                FROM rides r
                WHERE r.vehicleID = ?`,
        [vehicleId]
      );
      return rows[0];
    } catch (error) {
      console.error("Error getting vehicle stats:", error);
      throw error;
    }
  }
}

module.exports = Vehicle;
