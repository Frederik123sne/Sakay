const User = require("../models/User.model");
const path = require('path');
const fs = require('fs').promises;

class UserController {
  /**
   * Get user profile (works for any role)
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const role = req.user.user_type;

      const profile = await User.getProfileWithRole(userId, role);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      delete profile.password_hash;

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error(" Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.user_id;
      // Collect updates from body (may be from JSON or FormData)
      const updates = { ...req.body };

      // Handle profile photo upload if present
      if (req.files && req.files.profile_pic) {
        const photo = req.files.profile_pic;

        // Validate type
        const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowed.includes(photo.mimetype)) {
          return res.status(400).json({ success: false, message: 'Invalid profile image type' });
        }

        // Generate filename and paths
        const timestamp = Date.now();
        const ext = path.extname(photo.name) || '.jpg';
        const filename = `${userId}_${timestamp}${ext}`;
        const uploadPath = path.join(__dirname, '../../public/uploads/profiles', filename);
        const dbPath = `uploads/profiles/${filename}`;

        // Move uploaded file
        await photo.mv(uploadPath);

        // Set profile_pic to database path
        updates.profile_pic = dbPath;

        // Attempt to delete old profile image if exists
        try {
          const current = await User.findById(userId);
          if (current && current.profile_pic) {
            const old = path.join(__dirname, '../../public', current.profile_pic);
            await fs.unlink(old).catch(() => { });
          }
        } catch (err) {
          // Ignore deletion errors
        }
      }

      const success = await User.update(userId, updates);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
      }

      const updatedProfile = await User.findById(userId);
      delete updatedProfile.password_hash;

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  /**
   * Get user statistics
   */
  static async getStats(req, res) {
    try {
      const userId = req.user.user_id;
      const role = req.user.user_type;

      let stats = {};

      if (role === "driver") {
        stats = await User.getDriverStats(userId);
      } else if (role === "passenger") {
        stats = await User.getPassengerStats(userId);
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

module.exports = UserController;
