// server/middleware/auth.js
// JWT Authentication Middleware

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'sakaybravo';

/**
 * Middleware to verify JWT token
 * Protects routes that require authentication
 */
const verifyToken = (req, res, next) => {
    let token = null;

    // 1. Check Authorization header (format: "Bearer token")
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
    }

    // 2. Check cookies as fallback
    if (!token && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    }

    // No token found
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // Verify token using same secret as PHP
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user data to request object
        // Now all route handlers can access req.user
        req.user = decoded;

        // Continue to next middleware/route handler
        next();
    } catch (error) {
        // Token is invalid or expired
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

/**
 * Middleware to check user role
 * Use after verifyToken middleware
 * 
 * Example: router.get('/dashboard', verifyToken, requireRole('driver'), handler)
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const userRole = req.user.user_type;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Optional authentication
 * Verifies token if present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
    let token = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }

    if (!token && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token invalid, but we don't reject the request
            req.user = null;
        }
    }

    next();
};

module.exports = {
    verifyToken,
    requireRole,
    optionalAuth
};