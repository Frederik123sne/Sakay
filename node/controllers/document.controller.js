// node/controllers/document.controller.js
// Handle driver license and vehicle OR/CR document updates

const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

class DocumentController {
    /**
     * Update driver's license image
     * POST /api/driver/update-license
     */
    static async updateLicense(req, res) {
        const connection = await db.getConnection();

        try {
            const driverId = req.user.user_id;

            console.log('Updating license for driver:', driverId);
            console.log('Files received:', req.files);

            // Check if file was uploaded
            if (!req.files || !req.files.licenseImage) {
                return res.status(400).json({
                    success: false,
                    message: 'No license image file provided'
                });
            }

            const licenseFile = req.files.licenseImage;

            console.log('File details:', {
                name: licenseFile.name,
                size: licenseFile.size,
                mimetype: licenseFile.mimetype
            });

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(licenseFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only JPEG and PNG images are allowed.'
                });
            }

            // Validate file size (already handled by middleware, but double-check)
            if (licenseFile.size > 10 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 10MB limit'
                });
            }

            await connection.beginTransaction();

            // Get current license image path to delete old file
            const [currentDriver] = await connection.query(
                'SELECT license_image FROM driver WHERE driverID = ?',
                [driverId]
            );

            // Generate unique filename
            const timestamp = Date.now();
            const ext = path.extname(licenseFile.name);
            const filename = `${driverId}_${timestamp}${ext}`;

            // Full path on server
            const uploadPath = path.join(__dirname, '../../public/uploads/licenses', filename);
            // Path to store in database
            const dbPath = `uploads/licenses/${filename}`;

            console.log('Saving file to:', uploadPath);

            // Move file to destination
            await licenseFile.mv(uploadPath);

            console.log('File saved successfully');

            // Update database - set status to 'for_review'
            await connection.query(
                `UPDATE driver 
         SET license_image = ?, 
             license_status = 'for_review',
             verified_by = NULL,
             verified_at = NULL
         WHERE driverID = ?`,
                [dbPath, driverId]
            );

            console.log('Database updated');

            // Delete old license image if it exists
            if (currentDriver[0]?.license_image) {
                const oldFilePath = path.join(__dirname, '../../public', currentDriver[0].license_image);
                try {
                    await fs.unlink(oldFilePath);
                    console.log('Deleted old license image:', oldFilePath);
                } catch (err) {
                    console.log('Could not delete old license image:', err.message);
                }
            }

            await connection.commit();

            console.log('License update complete:', dbPath);

            res.json({
                success: true,
                message: 'License image updated successfully. Pending admin review.',
                data: {
                    imagePath: dbPath,
                    status: 'for_review'
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating license:', error);

            res.status(500).json({
                success: false,
                message: 'Failed to update license image',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Update vehicle OR/CR image
     * POST /api/driver/update-orcr
     */
    static async updateOrcr(req, res) {
        const connection = await db.getConnection();

        try {
            const driverId = req.user.user_id;
            const { vehicleId } = req.body;

            console.log('Updating OR/CR for driver:', driverId);
            console.log('Vehicle ID:', vehicleId);
            console.log('Files received:', req.files);

            // Check if file was uploaded
            if (!req.files || !req.files.orcrImage) {
                return res.status(400).json({
                    success: false,
                    message: 'No OR/CR image file provided'
                });
            }

            if (!vehicleId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle ID is required'
                });
            }

            const orcrFile = req.files.orcrImage;

            console.log('File details:', {
                name: orcrFile.name,
                size: orcrFile.size,
                mimetype: orcrFile.mimetype
            });

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(orcrFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only JPEG and PNG images are allowed.'
                });
            }

            // Validate file size
            if (orcrFile.size > 10 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 10MB limit'
                });
            }

            await connection.beginTransaction();

            // Verify vehicle belongs to driver
            const [vehicles] = await connection.query(
                'SELECT OR_CR FROM vehicles WHERE vehicleID = ? AND driverID = ?',
                [vehicleId, driverId]
            );

            if (vehicles.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Vehicle not found or access denied'
                });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const ext = path.extname(orcrFile.name);
            const filename = `${driverId}_${timestamp}${ext}`;

            // Full path on server
            const uploadPath = path.join(__dirname, '../../public/uploads/orcr', filename);
            // Path to store in database
            const dbPath = `uploads/orcr/${filename}`;

            console.log('Saving file to:', uploadPath);

            // Move file to destination
            await orcrFile.mv(uploadPath);

            console.log('File saved successfully');

            // Update database - set status to 'for_renewal'
            await connection.query(
                `UPDATE vehicles 
         SET OR_CR = ?, 
             vehicle_status = 'for_renewal',
             verified_by = NULL,
             verified_at = NULL
         WHERE vehicleID = ?`,
                [dbPath, vehicleId]
            );

            console.log('Database updated');

            // Delete old OR/CR image if it exists
            if (vehicles[0]?.OR_CR) {
                const oldFilePath = path.join(__dirname, '../../public', vehicles[0].OR_CR);
                try {
                    await fs.unlink(oldFilePath);
                    console.log('Deleted old OR/CR image:', oldFilePath);
                } catch (err) {
                    console.log('Could not delete old OR/CR image:', err.message);
                }
            }

            await connection.commit();

            console.log('OR/CR update complete:', dbPath);

            res.json({
                success: true,
                message: 'OR/CR image updated successfully. Pending admin review.',
                data: {
                    imagePath: dbPath,
                    status: 'for_renewal'
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating OR/CR:', error);

            res.status(500).json({
                success: false,
                message: 'Failed to update OR/CR image',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Get driver documents status
     * GET /api/driver/documents
     */
    static async getDocuments(req, res) {
        try {
            const driverId = req.user.user_id;

            // Get driver license info
            const [driverInfo] = await db.query(
                `SELECT license_image, license_status, license_number, license_expiry 
         FROM driver WHERE driverID = ?`,
                [driverId]
            );

            // Get vehicle OR/CR info
            const [vehicles] = await db.query(
                `SELECT vehicleID, OR_CR, vehicle_status, brand, model, plate_number 
         FROM vehicles WHERE driverID = ?`,
                [driverId]
            );

            res.json({
                success: true,
                data: {
                    license: driverInfo[0] || null,
                    vehicles: vehicles
                }
            });

        } catch (error) {
            console.error('Error getting documents:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get documents',
                error: error.message
            });
        }
    }
}

module.exports = DocumentController;