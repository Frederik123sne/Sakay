// node/models/User.model.js
// User Model - Handles all user database operations

const db = require('../config/database');

class User {
    /**
     * Find user by userID
     * @param {string} userId - User ID (e.g., 'D001', 'P001')
     * @returns {Promise<Object|null>} User object or null
     */
    static async findById(userId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM users WHERE userID = ?',
                [userId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    static async findByEmail(email) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {string} userId
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>}
     */
    static async update(userId, updates) {
        try {
            const allowedFields = ['first_name', 'last_name', 'phone', 'profile_pic'];
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

            values.push(userId);

            const [result] = await db.query(
                `UPDATE users SET ${updateFields.join(', ')} WHERE userID = ?`,
                values
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update last login timestamp
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    static async updateLastLogin(userId) {
        try {
            const [result] = await db.query(
                'UPDATE users SET last_login = NOW() WHERE userID = ?',
                [userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }

    /**
     * Get user profile with role-specific data
     * FIXED: Uses correct table names from your schema
     * @param {string} userId
     * @param {string} role - 'driver' or 'passenger'
     * @returns {Promise<Object|null>}
     */
    static async getProfileWithRole(userId, role) {
        try {
            if (role === 'driver') {
                const [rows] = await db.query(`
                    SELECT 
                        d.driverID,
                        u.userID,
                        u.email,
                        u.first_name,
                        u.last_name,
                        u.phone,
                        u.profile_pic,
                        u.status as user_status,
                        d.license_number,
                        d.license_type,
                        d.license_expiry,
                        d.license_image,
                        d.license_status,
                        d.average_rating,
                        d.total_rides,
                        u.created_at,
                        u.last_login
                    FROM driver d
                    INNER JOIN users u ON d.driverID = u.userID
                    WHERE d.driverID = ?
                    LIMIT 1
                `, [userId]);

                return rows[0] || null;

            } else if (role === 'passenger') {
                const [rows] = await db.query(`
                    SELECT 
                        p.passengerID,
                        u.userID,
                        u.email,
                        u.first_name,
                        u.last_name,
                        u.phone,
                        u.profile_pic,
                        u.status as user_status,
                        p.preferred_payment,
                        p.total_rides,
                        u.created_at,
                        u.last_login
                    FROM passenger p
                    INNER JOIN users u ON p.passengerID = u.userID
                    WHERE p.passengerID = ?
                    LIMIT 1
                `, [userId]);

                return rows[0] || null;
            }

            return null;
        } catch (error) {
            console.error('Error in getProfileWithRole:', error);
            throw error;
        }
    }

    /**
     * Get full user profile (works for any role)
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    static async getFullProfile(userId) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    u.*,
                    d.driverID,
                    d.license_number,
                    d.license_status,
                    d.average_rating as driver_rating,
                    d.total_rides as driver_rides,
                    p.passengerID,
                    p.preferred_payment,
                    p.total_rides as passenger_rides
                FROM users u
                LEFT JOIN driver d ON u.userID = d.driverID
                LEFT JOIN passenger p ON u.userID = p.passengerID
                WHERE u.userID = ?
                LIMIT 1
            `, [userId]);

            if (rows.length > 0) {
                // Remove sensitive data
                delete rows[0].password_hash;
                return rows[0];
            }

            return null;
        } catch (error) {
            console.error('Error getting full profile:', error);
            throw error;
        }
    }
}

module.exports = User;