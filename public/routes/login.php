<?php
// Disable HTML output and error display
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

// Set JSON header FIRST - before any output
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Buffer output to prevent any accidental HTML
ob_start();

try {
    // Include required files
    require_once __DIR__ . '/../../src/controllers/AuthController.php';
    require_once __DIR__ . '/../../src/core/Request.php';
    require_once __DIR__ . '/../../src/core/Response.php';
    require_once __DIR__ . '/../../src/core/Session.php';
    require_once __DIR__ . '/../../src/core/JWT.php';

    // Create Request and Response objects
    $request = new Request();
    $response = new Response();

    // Log the request
    error_log("Login Request - Method: " . $request->getMethod());
    error_log("Login Request - Content-Type: " . $request->header('Content-Type'));

    // Validate request method
    if (!$request->isMethod('POST')) {
        // Clear any buffered output
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed. Use POST.'
        ]);
        exit;
    }

    // Get input data
    $email = $request->input('email');
    $password = $request->input('password');

    error_log("Login Request - Email: " . ($email ?? 'none'));

    // Validate inputs
    if (empty($email) || empty($password)) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Email and password are required',
            'errors' => []
        ]);
        exit;
    }

    // Instantiate controller
    $authController = new AuthController();

    // Handle login - this returns a Response object
    $result = $authController->login($request, $response);

    // Clear buffer and send the response
    ob_clean();
    $result->send();
} catch (Exception $e) {
    // Log the error
    error_log("Login Error: " . $e->getMessage());
    error_log("Stack Trace: " . $e->getTraceAsString());

    // Clear any output buffer
    ob_clean();

    // Send JSON error response
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage(),
        'errors' => []
    ]);
}

// Clean up buffer
ob_end_flush();
