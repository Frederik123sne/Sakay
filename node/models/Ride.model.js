// node/models/Ride.model.js
// Enhanced Ride Model - FIXED: No fare validation required

const db = require("../config/database");

class Ride {
  // ==================== SLU BAKAKENG MARYHIEGHTS COORDINATES ====================
  static SLU_BAKAKENG = {
    lat: 16.38481,
    lng: 120.59396,
    address:
      "Saint Louis University - Bakakeng, Maryhieghts, Baguio City, Philippines",
    radius: 200, // 200 meters tolerance for GPS accuracy
  };

  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if a point is within tolerance of SLU Bakakeng
   */
  static isNearSLUBakakeng(lat, lng) {
    const distance = this.calculateDistance(
      lat,
      lng,
      this.SLU_BAKAKENG.lat,
      this.SLU_BAKAKENG.lng
    );
    return distance <= this.SLU_BAKAKENG.radius / 1000; // Convert meters to km
  }

  /**
   * Calculate realistic travel time considering Baguio traffic
   */
  static calculateRealisticTravelTime(distanceKm) {
    let baseSpeed;

    if (distanceKm < 2) {
      baseSpeed = 15; // 15 km/h
    } else if (distanceKm < 5) {
      baseSpeed = 20; // 20 km/h
    } else if (distanceKm < 10) {
      baseSpeed = 25; // 25 km/h
    } else {
      baseSpeed = 30; // 30 km/h
    }

    let travelMinutes = (distanceKm / baseSpeed) * 60;
    const trafficFactor = 1 + (Math.random() * 0.2 + 0.2); // 1.2 to 1.4
    travelMinutes *= trafficFactor;
    const stopTime = Math.min(distanceKm * 1.5, 15); // Max 15 minutes for stops
    travelMinutes += stopTime;

    return Math.round(travelMinutes / 5) * 5;
  }

  /**
   * Validate ride data before creation - FIXED: No fare validation
   */
  static validateRideData(rideData) {
    const errors = [];

    // Check if SLU Bakakeng is either origin or destination
    const startIsSLU = this.isNearSLUBakakeng(
      rideData.startPoint.lat,
      rideData.startPoint.lng
    );
    const endIsSLU = this.isNearSLUBakakeng(
      rideData.endPoint.lat,
      rideData.endPoint.lng
    );

    if (!startIsSLU && !endIsSLU) {
      errors.push(
        "Either the starting point or destination must be at or near SLU Bakakeng Campus (Maryhieghts, Baguio City)"
      );
    }

    // Validate departure time (must be in the future)
    const departureDate = new Date(rideData.departureTime);
    const now = new Date();

    if (departureDate <= now) {
      errors.push("Departure time must be in the future");
    }

    // Validate departure time (must be within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (departureDate > sevenDaysFromNow) {
      errors.push("Rides can only be created up to 7 days in advance");
    }

    // Validate minimum advance booking (at least 30 minutes from now)
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
    if (departureDate < thirtyMinutesFromNow) {
      errors.push("Rides must be created at least 30 minutes in advance");
    }

    // Validate seats
    if (
      !rideData.availableSeats ||
      rideData.availableSeats < 1 ||
      rideData.availableSeats > 4
    ) {
      errors.push("Available seats must be between 1 and 4");
    }

    // NO FARE VALIDATION - Removed

    // Validate distance
    const distance = this.calculateDistance(
      rideData.startPoint.lat,
      rideData.startPoint.lng,
      rideData.endPoint.lat,
      rideData.endPoint.lng
    );

    if (distance < 0.2) {
      errors.push("Ride distance is too short (minimum 200 meters)");
    }

    if (distance > 50) {
      errors.push(
        "Ride distance is too long (maximum 50 km from SLU Bakakeng)"
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Convert ISO string to MySQL datetime format
   */
  static formatDateTimeForMySQL(isoString) {
    if (!isoString) return null;

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Generate new ride ID
   */
  static async generateRideId() {
    try {
      const [rows] = await db.query(
        "SELECT rideID FROM rides ORDER BY rideID DESC LIMIT 1"
      );

      if (rows.length === 0) {
        return "R001";
      }

      const lastId = rows[0].rideID;
      const number = parseInt(lastId.substring(1)) + 1;
      return "R" + number.toString().padStart(3, "0");
    } catch (error) {
      console.error("Error generating ride ID:", error);
      throw error;
    }
  }

  /**
   * Get driver's primary vehicle
   */
  static async getDriverVehicle(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT vehicleID, brand, model, plate_number, seats_available, color, year
         FROM vehicles 
         WHERE driverID = ? AND vehicle_status = 'active'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [driverId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error getting driver vehicle:", error);
      throw error;
    }
  }

  /**
   * Create a new ride with validation - FIXED: No fare needed
   */
  static async create(rideData) {
    // Validate ride data
    const validation = this.validateRideData(rideData);
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Generate new ride ID
      const rideId = await this.generateRideId();

      // Get driver's active vehicle
      let vehicleId = rideData.vehicleID;
      if (!vehicleId) {
        const vehicle = await this.getDriverVehicle(rideData.userID);
        if (!vehicle) {
          throw new Error("No active vehicle found for driver");
        }
        vehicleId = vehicle.vehicleID;
      }

      // Calculate realistic travel time
      const distance = this.calculateDistance(
        rideData.startPoint.lat,
        rideData.startPoint.lng,
        rideData.endPoint.lat,
        rideData.endPoint.lng
      );
      const realisticDuration = this.calculateRealisticTravelTime(distance);

      // Override frontend estimation with realistic time
      rideData.estimatedDurationMinutes = realisticDuration;

      // Prepare coordinates with address
      const origin = JSON.stringify({
        lat: rideData.startPoint.lat,
        lng: rideData.startPoint.lng,
        address:
          rideData.startPoint.address ||
          `Location (${rideData.startPoint.lat.toFixed(
            4
          )}, ${rideData.startPoint.lng.toFixed(4)})`,
      });

      const destination = JSON.stringify({
        lat: rideData.endPoint.lat,
        lng: rideData.endPoint.lng,
        address:
          rideData.endPoint.address ||
          `Location (${rideData.endPoint.lat.toFixed(
            4
          )}, ${rideData.endPoint.lng.toFixed(4)})`,
      });

      // Format dates
      const departureTime = this.formatDateTimeForMySQL(rideData.departureTime);

      // Calculate arrival time using realistic duration
      const departureDate = new Date(rideData.departureTime);
      const arrivalDate = new Date(
        departureDate.getTime() + realisticDuration * 60000
      );
      const estimatedArrival = this.formatDateTimeForMySQL(
        arrivalDate.toISOString()
      );

      console.log("Validated Ride Data:");
      console.log("   Distance:", distance.toFixed(2), "km");
      console.log("   Realistic Duration:", realisticDuration, "minutes");
      console.log("   Departure:", departureTime);
      console.log("   Arrival:", estimatedArrival);

      // Insert ride - Changed status to 'posted' instead of 'requested'
      await connection.query(
        `INSERT INTO rides (
          rideID, userID, vehicleID, origin, destination, 
          departure_time, estimated_arrival, total_seats, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'posted', NOW())`,
        [
          rideId,
          rideData.userID,
          vehicleId,
          origin,
          destination,
          departureTime,
          estimatedArrival,
          rideData.availableSeats,
        ]
      );

      await connection.commit();

      const createdRide = await this.findById(rideId);

      return {
        rideID: rideId,
        ...createdRide,
        metadata: {
          distance: distance.toFixed(2),
          estimatedDurationMinutes: realisticDuration,
          startPoint: rideData.startPoint,
          endPoint: rideData.endPoint,
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error creating ride:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find ride by ID with complete information
   */
  static async findById(rideId) {
    try {
      const [rows] = await db.query(
        `SELECT 
          r.*,
          u.first_name, u.last_name, u.phone, u.email, u.profile_pic,
          v.brand, v.model, v.plate_number, v.color, v.year, v.seats_available,
          d.average_rating, d.total_rides, d.license_number
        FROM rides r
        JOIN users u ON r.userID = u.userID
        LEFT JOIN vehicles v ON r.vehicleID = v.vehicleID
        LEFT JOIN driver d ON u.userID = d.driverID
        WHERE r.rideID = ?`,
        [rideId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error finding ride by ID:", error);
      throw error;
    }
  }

  /**
 * Alternative: Get ALL driver rides with payment info (not just active)
 */
  static async findByDriver(driverId, status = null) {
    try {
      let query = `
      SELECT 
        r.rideID,
        r.userID,
        r.vehicleID,
        r.origin,
        r.destination,
        r.departure_time,
        r.estimated_arrival,
        r.total_seats,
        r.status,
        r.created_at,
        r.updated_at,
        v.brand,
        v.model,
        v.plate_number,
        v.color,
        v.year,
        COUNT(DISTINCT b.bookingID) as total_bookings,
        COALESCE(SUM(
          CASE 
            WHEN b.booking_status IN ('requested', 'confirmed', 'ongoing') 
            THEN b.seats_booked 
            ELSE 0 
          END
        ), 0) as booked_seats,
        GROUP_CONCAT(
          DISTINCT CASE 
            WHEN b.booking_status IN ('requested', 'confirmed', 'ongoing')
            THEN p.preferred_payment
            ELSE NULL
          END
        ) as payment_methods
      FROM rides r
      LEFT JOIN vehicles v ON r.vehicleID = v.vehicleID
      LEFT JOIN bookings b ON r.rideID = b.rideID
      LEFT JOIN passenger p ON b.userID = p.passengerID
      WHERE r.userID = ?
    `;

      const params = [driverId];

      if (status) {
        query += " AND r.status = ?";
        params.push(status);
      }

      query += `
      GROUP BY 
        r.rideID,
        r.userID,
        r.vehicleID,
        r.origin,
        r.destination,
        r.departure_time,
        r.estimated_arrival,
        r.total_seats,
        r.status,
        r.created_at,
        r.updated_at,
        v.brand,
        v.model,
        v.plate_number,
        v.color,
        v.year
      ORDER BY r.departure_time DESC
    `;

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error("Error finding rides by driver:", error);
      throw error;
    }
  }
  /**
   * Get active/upcoming rides for a driver
   * @param {string} driverId
   * @returns {Promise<Array>}
   */
  static async getActiveRides(driverId) {
    try {
      console.log("🔍 Getting active rides for driver:", driverId);

      const [rows] = await db.query(
        `SELECT 
        r.rideID,
        r.userID,
        r.vehicleID,
        r.origin,
        r.destination,
        r.departure_time,
        r.estimated_arrival,
        r.total_seats,
        r.status,
        r.created_at,
        r.updated_at,
        v.brand,
        v.model,
        v.plate_number,
        v.color,
        v.year,
        COUNT(DISTINCT b.bookingID) as total_bookings,
        COALESCE(SUM(
          CASE 
            WHEN b.booking_status IN ('requested', 'confirmed', 'ongoing') 
            THEN b.seats_booked 
            ELSE 0 
          END
        ), 0) as booked_seats,
        GROUP_CONCAT(
          DISTINCT CASE 
            WHEN b.booking_status IN ('requested', 'confirmed', 'ongoing')
            THEN p.preferred_payment
            ELSE NULL
          END
        ) as payment_methods
      FROM rides r
      LEFT JOIN vehicles v ON r.vehicleID = v.vehicleID
      LEFT JOIN bookings b ON r.rideID = b.rideID 
        AND b.booking_status IN ('requested', 'confirmed', 'ongoing')
      LEFT JOIN passenger p ON b.userID = p.passengerID
      WHERE r.userID = ?
        AND r.status IN ('posted', 'accepted', 'waiting_pickup', 'en_route', 'ongoing')
        AND r.departure_time > NOW()
      GROUP BY 
        r.rideID,
        r.userID,
        r.vehicleID,
        r.origin,
        r.destination,
        r.departure_time,
        r.estimated_arrival,
        r.total_seats,
        r.status,
        r.created_at,
        r.updated_at,
        v.brand,
        v.model,
        v.plate_number,
        v.color,
        v.year
      ORDER BY r.departure_time ASC`,
        [driverId]
      );

      console.log(`Found ${rows.length} active ride(s)`);
      return rows;
    } catch (error) {
      console.error("Error getting active rides:", error);
      throw error;
    }
  }

  // ALTERNATIVE: Get ALL rides without time/status filtering
  // Use this temporarily to see all your rides
  static async getAllDriverRides(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT 
        r.rideID,
        r.userID,
        r.vehicleID,
        r.origin,
        r.destination,
        r.departure_time,
        r.estimated_arrival,
        r.total_seats,
        r.status,
        r.created_at,
        r.updated_at,
        v.brand,
        v.model,
        v.plate_number,
        v.color,
        v.year,
        COUNT(DISTINCT b.bookingID) as total_bookings,
        COALESCE(SUM(
          CASE 
            WHEN b.booking_status IN ('requested', 'confirmed', 'ongoing') 
            THEN b.seats_booked 
            ELSE 0 
          END
        ), 0) as booked_seats
      FROM rides r
      LEFT JOIN vehicles v ON r.vehicleID = v.vehicleID
      LEFT JOIN bookings b ON r.rideID = b.rideID 
        AND b.booking_status IN ('requested', 'confirmed', 'ongoing')
      WHERE r.userID = ?
      GROUP BY 
        r.rideID,
        r.userID,
        r.vehicleID,
        r.origin,
        r.destination,
        r.departure_time,
        r.estimated_arrival,
        r.total_seats,
        r.status,
        r.created_at,
        r.updated_at,
        v.brand,
        v.model,
        v.plate_number,
        v.color,
        v.year
      ORDER BY r.created_at DESC`,
        [driverId]
      );

      console.log("📋 ALL driver rides (no filters):", rows);
      return rows;
    } catch (error) {
      console.error("Error getting all rides:", error);
      throw error;
    }
  }
  /**
   * Update ride information
   */
  static async update(rideId, updates) {
    try {
      const allowedFields = [
        "origin",
        "destination",
        "departure_time",
        "estimated_arrival",
        "total_seats",
        "status",
      ];

      const updateFields = [];
      const values = [];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          if (field === "departure_time" || field === "estimated_arrival") {
            updateFields.push(`${field} = ?`);
            values.push(this.formatDateTimeForMySQL(updates[field]));
          } else {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
          }
        }
      }

      if (updateFields.length === 0) {
        return false;
      }

      updateFields.push("updated_at = NOW()");
      values.push(rideId);

      const [result] = await db.query(
        `UPDATE rides SET ${updateFields.join(", ")} WHERE rideID = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating ride:", error);
      throw error;
    }
  }

  /**
   * Cancel ride
   */
  static async cancel(rideId, status = "driver_cancelled") {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE rides SET status = ?, updated_at = NOW() WHERE rideID = ?",
        [status, rideId]
      );

      await connection.query(
        `UPDATE bookings 
         SET booking_status = 'cancelled', updated_at = NOW() 
         WHERE rideID = ? AND booking_status NOT IN ('completed', 'cancelled')`,
        [rideId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("Error cancelling ride:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if ride belongs to driver
   */
  static async belongsToDriver(rideId, driverId) {
    try {
      const [rows] = await db.query(
        "SELECT 1 FROM rides WHERE rideID = ? AND userID = ?",
        [rideId, driverId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking ride ownership:", error);
      throw error;
    }
  }

  /**
   * Get ride statistics for a driver
   */
  static async getDriverStats(driverId) {
    try {
      const [rows] = await db.query(
        `SELECT 
          COUNT(*) as total_rides,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_rides,
          SUM(CASE WHEN status = 'cancelled' OR status = 'driver_cancelled' THEN 1 ELSE 0 END) as cancelled_rides,
          SUM(CASE WHEN status IN ('posted', 'accepted', 'ongoing') AND departure_time > NOW() THEN 1 ELSE 0 END) as upcoming_rides
        FROM rides
        WHERE userID = ?`,
        [driverId]
      );
      return rows[0];
    } catch (error) {
      console.error("Error getting driver stats:", error);
      throw error;
    }
  }

  /**
   * Get completed rides with booking details for history page
   * @param {string} driverId
   * @param {string} sortOrder - 'ASC' or 'DESC'
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  static async getCompletedRidesWithBookings(driverId, sortOrder = 'DESC', limit = 10, offset = 0) {
    try {
      // Ensure limit and offset are integers
      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;
      const validSort = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      const query = `SELECT 
          r.rideID,
          r.userID as driverID,
          r.origin,
          r.destination,
          r.departure_time,
          r.status,
          b.bookingID,
          b.seats_booked,
          b.total_fare,
          b.payment_status,
          p.first_name as passenger_first_name,
          p.last_name as passenger_last_name,
          u.first_name,
          u.last_name
        FROM rides r
        LEFT JOIN bookings b ON r.rideID = b.rideID
        LEFT JOIN users p ON b.userID = p.userID
        JOIN users u ON r.userID = u.userID
        WHERE r.userID = ? AND r.status IN ('completed', 'cancelled')
        ORDER BY r.departure_time ${validSort}
        LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;

      const [rows] = await db.query(query, [driverId]);

      return rows || [];
    } catch (error) {
      console.error('Error getting completed rides:', error);
      throw error;
    }
  }
}

module.exports = Ride;