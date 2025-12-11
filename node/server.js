// node/server.js
// UPDATED: Added file upload support with express-fileupload

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config();

// Import routes
const driverRoutes = require('./routes/driver.routes');
const passengerRoutes = require('./routes/passenger.routes');
const authRoutes = require('./routes/auth.routes');

// Create Express app
const app = express();
const PORT = process.env.NODE_PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow cross-origin requests
app.use(cors({
    origin: process.env.PHP_DOMAIN || 'http://localhost',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANT: File upload BEFORE body parser
app.use(fileUpload({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Parse JSON request bodies (increased limit for base64 fallback)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// SERVE STATIC FILES FROM PUBLIC FOLDER
// ============================================

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve assets
app.use('/assets', express.static(path.join(__dirname, '../public/views/assets')));

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sakay Bravo API Server (MVC)',
        version: '2.0.0',
        architecture: 'MVC Pattern',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/passenger', passengerRoutes);

// ============================================
// SERVE HTML PAGES
// ============================================

// Driver pages
app.get('/driver/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/home.html'));
});

app.get('/driver/rides', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/rides.html'));
});

app.get('/driver/create-ride', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/create_ride.html'));
});

app.get('/driver/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/profile.html'));
});

app.get('/driver/requirements', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/requirements.html'));
});

app.get('/driver/history', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/ride_history.html'));
});

app.get('/driver/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/driver/contact.html'));
});

// Passenger pages
app.get('/passenger/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/passenger/home.html'));
});

app.get('/passenger/book-ride', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/passenger/book_ride.html'));
});

app.get('/passenger/search-rides', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/passenger/search_rides.html'));
});

app.get('/passenger/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/passenger/profile.html'));
});

app.get('/passenger/history', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/passenger/booking_history.html'));
});

app.get('/passenger/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/passenger/contact.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Server Error:', error);

    // Handle file size limit error
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File size too large. Maximum size is 10MB.'
        });
    }

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('Sakay Bravo Node.js Server (Full Stack)');
    console.log('='.repeat(50));
    console.log(`Server running on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Architecture: MVC Pattern`);
    console.log(`File Upload: Enabled (Max 10MB)`);
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nSIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});