<?php

/**
 * Role Registration Route
 * Handles POST requests for completing user role registration (Driver/Passenger)
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

// Increase limits for base64 image uploads
ini_set('post_max_size', '20M');
ini_set('upload_max_filesize', '20M');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '300');

// Set headers for JSON API
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include required files
require_once __DIR__ . '/../../src/controllers/AuthController.php';
require_once __DIR__ . '/../../src/core/Request.php';
require_once __DIR__ . '/../../src/core/Response.php';
require_once __DIR__ . '/../../src/core/Session.php';

try {
    // ========================================
    // INITIALIZE REQUEST & RESPONSE
    // ========================================

    // Start session
    Session::start();

    // Create Request and Response objects
    $request = new Request();
    $response = new Response();

    // Log request info
    error_log("=== Role Registration Request ===");
    error_log("Method: " . $request->getMethod());
    error_log("URI: " . $request->getUri());
    error_log("Content-Type: " . $request->header('Content-Type'));

    // ========================================
    // AUTHENTICATION CHECK
    // ========================================

    if (!Session::isLoggedIn()) {
        error_log("Role registration - User not authenticated");
        $response->unauthorized('You must be logged in to complete registration')->send();
        exit;
    }

    $userID = Session::getUserId();
    $userEmail = Session::get('email');

    error_log("Role registration - User ID: $userID, Email: $userEmail");

    // ========================================
    // VALIDATE REQUEST METHOD
    // ========================================

    if (!$request->isMethod('POST')) {
        error_log("Role registration - Invalid method: " . $request->getMethod());
        $response->error('Method not allowed. Use POST.', null, 405)->send();
        exit;
    }

    // ========================================
    // VALIDATE JSON CONTENT
    // ========================================

    if (!$request->isJson()) {
        error_log("Role registration - Invalid content type");
        $response->error('Content-Type must be application/json', null, 400)->send();
        exit;
    }

    // ========================================
    // GET INPUT DATA
    // ========================================

    $inputData = $request->all();

    // Debug: Check if input data is empty
    if (empty($inputData)) {
        error_log("Role registration - WARNING: Input data is empty!");
        error_log("Raw input: " . file_get_contents('php://input'));
    }

    // Log received data (without sensitive info)
    error_log("Role registration - Input data: " . json_encode([
        'role' => $inputData['role'] ?? 'none',
        'has_license_image' => !empty($inputData['license_image']),
        'has_vehicle_photo' => !empty($inputData['vehicle_photo']),
        'has_profile_photo' => !empty($inputData['profile_photo']),
        'license_number' => $inputData['license_number'] ?? 'none',
        'vehicle_brand' => $inputData['vehicle_brand'] ?? 'none',
        'plate_number' => $inputData['plate_number'] ?? 'none',
        'data_count' => count($inputData),
    ]));

    // ========================================
    // VALIDATE REQUIRED FIELDS
    // ========================================

    if (empty($inputData)) {
        error_log("Role registration - No input data received");
        $response->error('No data received. Please check your request.', null, 400)->send();
        exit;
    }

    if (!$request->has('role')) {
        error_log("Role registration - Missing role field");
        error_log("Available fields: " . implode(', ', array_keys($inputData)));
        $response->validationError(['role' => 'Role is required'], 'Missing required field')->send();
        exit;
    }

    $role = $request->input('role');

    if (!in_array($role, ['driver', 'passenger'])) {
        error_log("Role registration - Invalid role: $role");
        $response->validationError(['role' => 'Invalid role. Must be driver or passenger'], 'Invalid role')->send();
        exit;
    }

    // ========================================
    // ROLE-SPECIFIC VALIDATION
    // ========================================

    $validationErrors = [];

    if ($role === 'driver') {
        // Validate driver-specific fields
        $requiredFields = [
            'license_number' => 'License number',
            'license_type' => 'License type',
            'license_expiry' => 'License expiry date',
            'vehicle_brand' => 'Vehicle brand',
            'vehicle_model' => 'Vehicle model',
            'vehicle_color' => 'Vehicle color',
            'vehicle_year' => 'Vehicle year',
            'plate_number' => 'Plate number',
            'seats_available' => 'Number of seats',
            'license_image' => 'License image',
            'vehicle_photo' => 'Vehicle OR/CR image',
            'profile_photo' => 'Profile photo',
        ];

        foreach ($requiredFields as $field => $label) {
            if (!$request->has($field) || empty($request->input($field))) {
                $validationErrors[$field] = "$label is required";
            }
        }

        // If there are validation errors, return them
        if (!empty($validationErrors)) {
            error_log("Role registration - Driver validation errors: " . json_encode($validationErrors));
            $response->validationError($validationErrors, 'Please fill in all required fields')->send();
            exit;
        }
    } else {
        // Validate passenger-specific fields
        if (!$request->has('preferred_payment')) {
            $validationErrors['preferred_payment'] = 'Payment method is required';
        }

        if (!$request->has('profile_photo') || empty($request->input('profile_photo'))) {
            $validationErrors['profile_photo'] = 'Profile photo is required';
        }

        if (!empty($validationErrors)) {
            error_log("Role registration - Passenger validation errors: " . json_encode($validationErrors));
            $response->validationError($validationErrors, 'Please fill in all required fields')->send();
            exit;
        }
    }

    // ========================================
    // PROCESS REGISTRATION
    // ========================================

    error_log("Role registration - Validation passed, processing registration");

    // Instantiate controller
    $authController = new AuthController();

    // Call the registration method and let it handle the response
    $result = $authController->completeRoleRegistration($request, $response);

    // Send the response
    $result->send();
} catch (Exception $e) {
    // ========================================
    // ERROR HANDLING
    // ========================================

    // Log the full error
    error_log("=== Role Registration Fatal Error ===");
    error_log("Error Message: " . $e->getMessage());
    error_log("File: " . $e->getFile());
    error_log("Line: " . $e->getLine());
    error_log("Stack Trace: " . $e->getTraceAsString());

    // Create response object if not exists
    if (!isset($response)) {
        $response = new Response();
    }

    // Send error response
    $response->serverError('Registration failed: ' . $e->getMessage())->send();
}
