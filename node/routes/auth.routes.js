// server/routes/auth.routes.js
// Authentication routes (verify token, refresh, etc.)

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'sakaybravo';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

/**
 * POST /api/auth/verify
 * Verify if current token is valid
 */
router.post('/verify', verifyToken, (req, res) => {
    // If middleware passes, token is valid
    res.json({
        success: true,
        authenticated: true,
        user: req.user
    });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (extend expiration)
 */
router.post('/refresh', verifyToken, (req, res) => {
    try {
        // Create new token with same user data
        const newToken = jwt.sign(
            {
                user_id: req.user.user_id,
                user_type: req.user.user_type,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Set new token as cookie
        res.cookie('auth_token', newToken, {
            httpOnly: true,
            maxAge: 30 * 60 * 1000, // 30 minutes
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax'
        });

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user (clear cookie)
 */
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;