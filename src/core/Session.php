<?php

class Session
{
    // Define dashboard paths for each user type
    // UPDATED: Driver and Passenger now go to Node.js server
    private static $dashboardPaths = [
        'admin' => 'views/admin/adminDashboard.php',
        'driver' => 'http://localhost:3000/driver/home',
        'passenger' => 'http://localhost:3000/passenger/home'
    ];

    // Session timeout (30 minutes)
    private static $timeout = 1800;

    // ============================================
    // BASIC SESSION OPERATIONS
    // ============================================

    /**
     * Start session if not already started
     */
    public static function start()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /**
     * Set a session variable
     */
    public static function set($key, $value)
    {
        self::start();
        $_SESSION[$key] = $value;
    }

    /**
     * Get a session variable
     */
    public static function get($key, $default = null)
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Check if session variable exists
     */
    public static function has($key)
    {
        self::start();
        return isset($_SESSION[$key]);
    }

    /**
     * Remove a session variable
     */
    public static function remove($key)
    {
        self::start();
        if (isset($_SESSION[$key])) {
            unset($_SESSION[$key]);
        }
    }

    /**
     * Get all session data
     */
    public static function all()
    {
        self::start();
        return $_SESSION;
    }

    /**
     * Clear all session data but keep session alive
     */
    public static function clear()
    {
        self::start();
        $_SESSION = [];
    }

    /**
     * Destroy session completely
     */
    public static function destroy()
    {
        self::start();

        // Clear all session variables
        $_SESSION = [];

        // Delete session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(
                session_name(),
                '',
                time() - 3600,
                '/',
                '',
                false,
                true
            );
        }

        // Destroy the session
        session_destroy();
    }

    /**
     * Regenerate session ID (security - prevent session fixation)
     */
    public static function regenerate($deleteOld = true)
    {
        self::start();
        session_regenerate_id($deleteOld);
    }

    // ============================================
    // FLASH MESSAGES
    // ============================================

    /**
     * Flash message - set a message that expires after next request
     */
    public static function flash($key, $value)
    {
        self::start();
        $_SESSION['_flash'][$key] = $value;
    }

    /**
     * Get flash message and remove it
     */
    public static function getFlash($key, $default = null)
    {
        self::start();
        $value = $_SESSION['_flash'][$key] ?? $default;
        unset($_SESSION['_flash'][$key]);
        return $value;
    }

    /**
     * Check if flash message exists
     */
    public static function hasFlash($key)
    {
        self::start();
        return isset($_SESSION['_flash'][$key]);
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    /**
     * Check if user is logged in
     */
    public static function isLoggedIn()
    {
        return self::has('user_id') && self::has('user_type');
    }

    /**
     * Get current user ID
     */
    public static function getUserId()
    {
        return self::get('user_id');
    }

    /**
     * Get current user type (admin, driver, passenger)
     */
    public static function getUserType()
    {
        return self::get('user_type');
    }

    /**
     * Get current user data
     */
    public static function getUser()
    {
        return [
            'user_id' => self::get('user_id'),
            'user_type' => self::get('user_type'),
            'email' => self::get('email'),
            'firstName' => self::get('firstName'),
            'lastName' => self::get('lastName')
        ];
    }

    /**
     * Login - Set user session after authentication
     */
    public static function login($userData)
    {
        // Regenerate session ID for security
        self::regenerate();

        // Set user data
        self::set('user_id', $userData['user_id']);
        self::set('user_type', $userData['user_type']);
        self::set('email', $userData['email']);
        self::set('firstName', $userData['firstName'] ?? '');
        self::set('lastName', $userData['lastName'] ?? '');
        self::set('login_time', time());

        // Flash success message
        self::flash('success', 'Login successful');
    }

    /**
     * Logout user
     */
    public static function logout()
    {
        self::flash('success', 'Logged out successfully');
        self::destroy();
    }

    /**
     * Check if user is admin
     */
    public static function isAdmin()
    {
        return self::getUserType() === 'admin';
    }

    /**
     * Check if user is driver
     */
    public static function isDriver()
    {
        return self::getUserType() === 'driver';
    }

    /**
     * Check if user is passenger
     */
    public static function isPassenger()
    {
        return self::getUserType() === 'passenger';
    }

    // ============================================
    // SESSION TIMEOUT
    // ============================================

    /**
     * Check if session has expired
     */
    public static function hasExpired()
    {
        $loginTime = self::get('login_time');

        if (!$loginTime) {
            return true;
        }

        return (time() - $loginTime) > self::$timeout;
    }

    /**
     * Refresh session timeout
     */
    public static function refreshTimeout()
    {
        self::set('login_time', time());
    }

    /**
     * Check session expiration and logout if expired
     */
    public static function checkExpiration()
    {
        if (self::isLoggedIn() && self::hasExpired()) {
            self::flash('error', 'Session expired. Please login again.');
            self::logout();
            self::redirectToLogin();
        }

        // Refresh timeout on activity
        self::refreshTimeout();
    }

    // ============================================
    // REDIRECTS & ACCESS CONTROL
    // ============================================

    /**
     * Get dashboard path for user type
     */
    public static function getDashboardPath($userType = null)
    {
        $userType = $userType ?? self::getUserType();
        return self::$dashboardPaths[$userType] ?? 'auth.php';
    }

    /**
     * Redirect to user's dashboard
     */
    public static function redirectToDashboard()
    {
        $userType = self::getUserType();

        if (!$userType) {
            self::redirectToLogin();
            return;
        }

        $path = self::getDashboardPath($userType);
        header("Location: $path");
        exit();
    }

    /**
     * Redirect to login page
     */
    public static function redirectToLogin()
    {
        header("Location: auth.php");
        exit();
    }

    /**
     * Require login - redirect to login if not logged in
     */
    public static function requireLogin()
    {
        if (!self::isLoggedIn()) {
            self::flash('error', 'Please login to continue');
            self::redirectToLogin();
        }
    }

    /**
     * Require specific user type
     */
    public static function requireUserType($requiredType)
    {
        self::requireLogin();

        $userType = self::getUserType();

        if ($userType !== $requiredType) {
            self::flash('error', 'Access denied');
            self::redirectToDashboard();
        }
    }

    /**
     * Require admin access
     */
    public static function requireAdmin()
    {
        self::requireUserType('admin');
    }

    /**
     * Require driver access
     */
    public static function requireDriver()
    {
        self::requireUserType('driver');
    }

    /**
     * Require passenger access
     */
    public static function requirePassenger()
    {
        self::requireUserType('passenger');
    }

    /**
     * Redirect logged-in users away from public pages (like login/register)
     */
    public static function redirectIfLoggedIn()
    {
        if (self::isLoggedIn()) {
            self::redirectToDashboard();
        }
    }

    /**
     * Check if current page matches user's designated area
     */
    public static function isInCorrectArea()
    {
        $userType = self::getUserType();
        if (!$userType) {
            return false;
        }

        $currentPath = $_SERVER['REQUEST_URI'];
        $expectedArea = self::getAreaFromUserType($userType);

        if (!$expectedArea) {
            return false;
        }

        // Check if current path contains the expected area
        return strpos($currentPath, $expectedArea) !== false;
    }

    /**
     * Get area name from user type
     */
    private static function getAreaFromUserType($userType)
    {
        $areas = [
            'admin' => 'admin',
            'driver' => 'driver',
            'passenger' => 'passenger'
        ];

        return $areas[$userType] ?? null;
    }

    /**
     * Check and redirect if user is in wrong area
     */
    public static function checkAndRedirect()
    {
        self::requireLogin();

        if (!self::isInCorrectArea()) {
            self::flash('warning', 'Redirected to your dashboard');
            self::redirectToDashboard();
        }
    }
}
