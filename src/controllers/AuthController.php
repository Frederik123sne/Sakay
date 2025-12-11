<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../core/Session.php';
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/JWT.php';

class AuthController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
        Session::start();
    }

    /**
     * Validate SLU Email Domain
     */
    private function isValidSLUEmail($email)
    {
        return preg_match('/^[a-zA-Z0-9._-]+@slu\.edu\.ph$/i', $email);
    }

    /**
     * Validate Philippine Phone Number
     */
    private function validatePhoneNumber($phone)
    {
        // Remove any spaces, dashes, or parentheses
        $cleanPhone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // Philippine mobile number formats:
        // 09XX-XXX-XXXX (11 digits starting with 09)
        // +639XX-XXX-XXXX (13 characters with +63)
        // 639XX-XXX-XXXX (12 digits starting with 63)

        $isValid = preg_match('/^(09|\+639|639)\d{9}$/', $cleanPhone);

        if (!$isValid) {
            return [
                'valid' => false,
                'message' => 'Invalid Philippine phone number. Use format: 09XX-XXX-XXXX'
            ];
        }

        return [
            'valid' => true,
            'normalized' => $cleanPhone
        ];
    }

    /**
     * Validate Password Strength
     */
    private function validatePasswordStrength($password)
    {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters long';
        }
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};:\'",.<>\/?\\\\|`~]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate Philippine Driver's License Number
     */
    private function validatePHLicenseNumber($licenseNumber)
    {
        // Format: X##-##-######
        // Example: N01-12-123456
        return preg_match('/^[A-Z]\d{2}-\d{2}-\d{6}$/', $licenseNumber);
    }

    /**
     * Handle Registration
     */
    public function register($request, $response)
    {
        try {
            // Get input data
            $firstName = trim($request->input('first_name'));
            $lastName = trim($request->input('last_name'));
            $email = trim($request->input('email'));
            $phone = trim($request->input('phone'));
            $password = $request->input('password');
            $confirmPassword = $request->input('confirmPassword');

            // Validation
            if (empty($firstName) || empty($lastName) || empty($email) || empty($phone) || empty($password)) {
                return $response->error('All fields are required', null, 400);
            }

            // Validate SLU Email
            if (!$this->isValidSLUEmail($email)) {
                return $response->error('Please use a valid SLU email address (@slu.edu.ph)', null, 400);
            }

            // Validate Phone Number
            $phoneValidation = $this->validatePhoneNumber($phone);
            if (!$phoneValidation['valid']) {
                return $response->error($phoneValidation['message'], null, 400);
            }
            // Use normalized phone number
            $phone = $phoneValidation['normalized'];

            // Validate Password Strength
            $passwordValidation = $this->validatePasswordStrength($password);
            if (!$passwordValidation['valid']) {
                return $response->error('Password does not meet requirements', $passwordValidation['errors'], 400);
            }

            // Check password match
            if ($password !== $confirmPassword) {
                return $response->error('Passwords do not match', null, 400);
            }

            // Call User model register method
            // Note: User model now handles phone/email duplicate checks and status assignment
            // Passengers will get 'active' status, drivers will get 'pending_verification'
            $result = $this->userModel->register($firstName, $lastName, $email, $phone, $password, 'passenger');

            if ($result['success']) {
                // Set session using Session class
                Session::login([
                    'user_id' => $result['userID'],
                    'user_type' => $result['role'],
                    'email' => $email,
                    'firstName' => $firstName,
                    'lastName' => $lastName
                ]);

                return $response->success([
                    'userID' => $result['userID'],
                    'role' => $result['role'],
                    'redirect' => 'setRole.php'
                ], $result['message'], 201);
            }

            // Handle specific error messages from User model
            return $response->error($result['message'], null, 400);
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return $response->serverError('Registration failed. Please try again.');
        }
    }

    /**
     * Handle Login
     */
    public function login($request, $response)
    {
        try {
            $email = trim($request->input('email'));
            $password = $request->input('password');

            if (empty($email) || empty($password)) {
                return $response->error('Email and password are required', null, 400);
            }

            if (!$this->isValidSLUEmail($email)) {
                return $response->error('Please use a valid SLU email address (@slu.edu.ph)', null, 400);
            }

            $result = $this->userModel->login($email, $password);

            if ($result['success']) {
                $user = $result['user'];

                // ===== NEW: CREATE JWT TOKEN =====
                $token = JWT::createTokenFromUser([
                    'user_id' => $user['userID'],
                    'user_type' => $user['role'],
                    'email' => $user['email'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name']
                ]);

                // Set JWT token as cookie (for Node.js to read)
                JWT::setTokenCookie($token);
                // ==================================

                // Set PHP session (for admin panel)
                Session::login([
                    'user_id' => $user['userID'],
                    'user_type' => $user['role'],
                    'email' => $user['email'],
                    'firstName' => $user['first_name'],
                    'lastName' => $user['last_name']
                ]);

                $dashboardPath = Session::getDashboardPath($user['role']);

                return $response->success([
                    'userID' => $user['userID'],
                    'role' => $user['role'],
                    'dashboardPath' => $dashboardPath,
                    'token' => $token  // Send token to frontend
                ], 'Login successful', 200);
            }

            return $response->error($result['message'], null, 401);
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return $response->serverError('Login failed. Please try again.');
        }
    }

    /**
     * Complete Role Registration with Enhanced Validation
     */
    public function completeRoleRegistration($request, $response)
    {
        try {
            error_log("=== Starting completeRoleRegistration ===");

            // Check authentication
            if (!Session::isLoggedIn()) {
                error_log("User not authenticated");
                return $response->unauthorized('User not authenticated');
            }

            $userID = Session::getUserId();
            error_log("User ID from session: $userID");

            $role = $request->input('role');
            error_log("Role selected: $role");

            if (empty($role) || !in_array($role, ['driver', 'passenger'])) {
                error_log("Invalid role: $role");
                return $response->error('Invalid role specified', null, 400);
            }

            // Prepare role data
            $roleData = [
                'role' => $role
            ];

            if ($role === 'driver') {
                // Validate driver-specific fields
                $licenseNumber = trim($request->input('license_number'));
                $licenseType = trim($request->input('license_type'));
                $licenseExpiry = trim($request->input('license_expiry'));
                $vehicleBrand = trim($request->input('vehicle_brand'));
                $vehicleModel = trim($request->input('vehicle_model'));
                $vehicleColor = trim($request->input('vehicle_color'));
                $vehicleYear = trim($request->input('vehicle_year'));
                $plateNumber = trim($request->input('plate_number'));
                $seatsAvailable = trim($request->input('seats_available'));

                error_log("Driver data - License: $licenseNumber, Vehicle: $vehicleBrand $vehicleModel, Plate: $plateNumber");

                // Validate required fields
                if (
                    empty($licenseNumber) || empty($licenseType) || empty($licenseExpiry) ||
                    empty($vehicleBrand) || empty($vehicleModel) || empty($vehicleColor) ||
                    empty($vehicleYear) || empty($plateNumber) || empty($seatsAvailable)
                ) {
                    error_log("Missing required driver fields");
                    return $response->error('All driver fields are required', null, 400);
                }

                // Validate Philippine license number format
                if (!$this->validatePHLicenseNumber($licenseNumber)) {
                    error_log("Invalid license format: $licenseNumber");
                    return $response->error('Invalid license number format. Use format: A00-00-000000 (e.g., N01-12-123456)', null, 400);
                }

                // Validate license type (only Professional allowed)
                if ($licenseType !== 'Professional') {
                    error_log("Invalid license type: $licenseType");
                    return $response->error('Only Professional license type is accepted', null, 400);
                }

                // Validate license expiry is in the future
                $expiryDate = strtotime($licenseExpiry);
                if ($expiryDate <= time()) {
                    error_log("License expired: $licenseExpiry");
                    return $response->error('License expiry date must be in the future', null, 400);
                }

                // Validate plate number format
                if (!preg_match('/^[A-Z0-9]{2,3}-[A-Z0-9]{3,4}$/i', $plateNumber)) {
                    error_log("Invalid plate format: $plateNumber");
                    return $response->error('Invalid plate number format. Use format: ABC-1234 or AB-1234', null, 400);
                }

                // Check if license number already exists
                $licenseCheck = $this->userModel->checkLicenseExists($licenseNumber);
                if ($licenseCheck) {
                    error_log("License already exists: $licenseNumber");
                    return $response->error('This license number is already registered', null, 400);
                }

                // Check if plate number already exists
                $plateCheck = $this->userModel->checkPlateExists($plateNumber);
                if ($plateCheck) {
                    error_log("Plate already exists: $plateNumber");
                    return $response->error('This plate number is already registered', null, 400);
                }

                $roleData['license_number'] = $licenseNumber;
                $roleData['license_type'] = $licenseType;
                $roleData['license_expiry'] = $licenseExpiry;
                $roleData['vehicle_brand'] = $vehicleBrand;
                $roleData['vehicle_model'] = $vehicleModel;
                $roleData['vehicle_color'] = $vehicleColor;
                $roleData['vehicle_year'] = $vehicleYear;
                $roleData['plate_number'] = strtoupper($plateNumber);
                $roleData['seats_available'] = $seatsAvailable;

                // Handle image uploads
                $roleData['license_image'] = $request->input('license_image');
                $roleData['vehicle_photo'] = $request->input('vehicle_photo');
                $roleData['profile_photo'] = $request->input('profile_photo');

                error_log("Driver images - License: " . (!empty($roleData['license_image']) ? 'present' : 'missing') .
                    ", Vehicle: " . (!empty($roleData['vehicle_photo']) ? 'present' : 'missing') .
                    ", Profile: " . (!empty($roleData['profile_photo']) ? 'present' : 'missing'));
            } else {
                // Passenger role data
                $roleData['preferred_payment'] = $request->input('preferred_payment', 'cash');
                $roleData['profile_photo'] = $request->input('profile_photo');

                error_log("Passenger data - Payment: " . $roleData['preferred_payment']);
            }

            // Call User model method
            // Note: completeRoleRegistration will set status to 'active' for passengers
            // and 'pending_verification' for drivers
            error_log("Calling userModel->completeRoleRegistration");
            $result = $this->userModel->completeRoleRegistration($userID, $roleData);

            if ($result['success']) {
                error_log("Registration successful - New ID: " . $result['userID']);

                // Update session with new userID and role
                Session::set('user_id', $result['userID']);
                Session::set('user_type', $result['role']);

                return $response->success([
                    'userID' => $result['userID'],
                    'role' => $result['role'],
                    'dashboardPath' => Session::getDashboardPath($result['role'])
                ], $result['message'], 200);
            }

            error_log("Registration failed: " . $result['message']);
            return $response->error($result['message'], null, 400);
        } catch (Exception $e) {
            error_log("=== Role registration exception ===");
            error_log("Error message: " . $e->getMessage());
            error_log("Error file: " . $e->getFile());
            error_log("Error line: " . $e->getLine());
            error_log("Stack trace: " . $e->getTraceAsString());

            return $response->serverError('Registration error: ' . $e->getMessage());
        }
    }

    /**
     * Logout User
     */
    public function logout($request, $response)
    {
        Session::logout();
        return $response->success(null, 'Logged out successfully', 200);
    }

    /**
     * Get Current User
     */
    public function getCurrentUser($request, $response)
    {
        if (!Session::isLoggedIn()) {
            return $response->unauthorized('Not authenticated');
        }

        $userData = Session::getUser();
        return $response->success($userData, 'User data retrieved', 200);
    }
}
