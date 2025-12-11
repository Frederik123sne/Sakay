<?php
require_once __DIR__ . '/../config/config.php';

class User
{
    private $conn;
    private $itemsPerPage = 5;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }
    /**
     * Register User
     */
    public function register($firstName, $lastName, $email, $phone, $password, $role = 'passenger')
    {
        try {
            $this->conn->begin_transaction();

            // --- Check if email or phone already exists ---
            $checkQuery = "SELECT email, phone FROM users WHERE email = ? OR phone = ?";
            $stmt = $this->conn->prepare($checkQuery);
            $stmt->bind_param('ss', $email, $phone);
            $stmt->execute();
            $existing = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if ($existing) {
                $this->conn->rollback();

                if ($existing['email'] === $email) {
                    return ['success' => false, 'message' => 'Email already exists'];
                }

                if ($existing['phone'] === $phone) {
                    return ['success' => false, 'message' => 'Phone number already exists'];
                }
            }

            // --- Generate User ID Prefix ---
            $prefix = ($role === 'driver') ? 'D' : 'P';

            $idQuery = "SELECT userID FROM users 
                    WHERE userID LIKE CONCAT(?, '%') 
                    ORDER BY userID DESC LIMIT 1";
            $stmt = $this->conn->prepare($idQuery);
            $stmt->bind_param('s', $prefix);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            $nextNumber = $result ? intval(substr($result['userID'], 1)) + 1 : 1;
            $newUserID = $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            // --- Hash password ---
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // --- Role-based status ---
            $status = ($role === 'driver') ? 'pending_verification' : 'active';

            // --- Insert into users table ---
            $query = "INSERT INTO users 
                  (userID, first_name, last_name, email, phone, password_hash, role, status, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                'ssssssss',
                $newUserID,
                $firstName,
                $lastName,
                $email,
                $phone,
                $hashedPassword,
                $role,
                $status
            );
            $inserted = $stmt->execute();
            $stmt->close();

            if (!$inserted) {
                throw new Exception('Failed to create user account');
            }

            // --- Insert role-specific record ---
            if ($role === 'passenger') {
                $passengerQuery = "INSERT INTO passenger (passengerID, preferred_payment, total_rides)
                               VALUES (?, 'cash', 0)";
                $stmt = $this->conn->prepare($passengerQuery);
                $stmt->bind_param('s', $newUserID);
                $stmt->execute();
                $stmt->close();
            } else if ($role === 'driver') {
                $driverQuery = "INSERT INTO driver (driverID, verification_status, rating)
                            VALUES (?, 'pending', 0)";
                $stmt = $this->conn->prepare($driverQuery);
                $stmt->bind_param('s', $newUserID);
                $stmt->execute();
                $stmt->close();
            }

            $this->conn->commit();

            return [
                'success' => true,
                'userID' => $newUserID,
                'role' => $role,
                'message' => 'Registration successful'
            ];
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Registration error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ];
        }
    }



    /**
     * Login User
     */
    public function login($email, $password)
    {
        try {
            if (empty($email) || empty($password)) {
                return ['success' => false, 'message' => 'Please enter both email and password.'];
            }

            // Fetch user from database
            $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $stmt->close();

            if (!$user) {
                error_log("Login failed: No user found with email: $email");
                return ['success' => false, 'message' => 'No user found with that email.'];
            }

            // Verify password
            if (!password_verify($password, $user['password_hash'])) {
                error_log("Login failed: Incorrect password for email: $email");
                return ['success' => false, 'message' => 'Incorrect password.'];
            }

            // Check if user account is active (except for admins)
            if ($user['role'] !== 'admin' && $user['status'] === 'suspended') {
                error_log("Login failed: Suspended account - UserID: {$user['userID']}");
                return ['success' => false, 'message' => 'Your account has been suspended. Please contact support.'];
            }

            // Update last login timestamp
            $updateStmt = $this->conn->prepare("UPDATE users SET last_login = NOW() WHERE userID = ?");
            $updateStmt->bind_param("s", $user['userID']);
            $updateStmt->execute();
            $updateStmt->close();

            // Log successful login with role info
            error_log("Login successful - UserID: {$user['userID']}, Role: {$user['role']}, Email: $email");

            return ['success' => true, 'user' => $user];
        } catch (Exception $e) {
            error_log("Login exception: " . $e->getMessage());
            return ['success' => false, 'message' => 'Login failed: ' . $e->getMessage()];
        }
    }

    /**
     * Check if license number already exists
     */
    public function checkLicenseExists($licenseNumber)
    {
        try {
            $query = "SELECT COUNT(*) as cnt FROM driver WHERE license_number = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('s', $licenseNumber);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $result['cnt'] > 0;
        } catch (Exception $e) {
            error_log("Check license error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if plate number already exists
     */
    public function checkPlateExists($plateNumber)
    {
        try {
            $query = "SELECT COUNT(*) as cnt FROM vehicles WHERE plate_number = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('s', $plateNumber);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $result['cnt'] > 0;
        } catch (Exception $e) {
            error_log("Check plate error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Complete role-specific registration
     * Upgrades Passenger → Driver or updates Passenger info
     */
    public function completeRoleRegistration($userID, $roleData)
    {
        try {
            $this->conn->begin_transaction();

            $role = $roleData['role'];

            if ($role === 'driver') {
                // ========================================
                // DRIVER REGISTRATION
                // ========================================

                // Verify user exists
                $checkQuery = "SELECT role, userID FROM users WHERE userID = ?";
                $stmt = $this->conn->prepare($checkQuery);
                $stmt->bind_param('s', $userID);
                $stmt->execute();
                $user = $stmt->get_result()->fetch_assoc();
                $stmt->close();

                if (!$user) {
                    throw new Exception('User not found');
                }

                // Check for duplicate license
                if ($this->checkLicenseExists($roleData['license_number'])) {
                    throw new Exception('This license number is already registered');
                }

                // Check for duplicate plate
                if ($this->checkPlateExists($roleData['plate_number'])) {
                    throw new Exception('This plate number is already registered');
                }

                // Generate new driver ID
                $prefix = 'D';
                $driverIDQuery = "SELECT userID FROM users WHERE userID LIKE CONCAT(?, '%') ORDER BY userID DESC LIMIT 1";
                $stmt = $this->conn->prepare($driverIDQuery);
                $stmt->bind_param('s', $prefix);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                $stmt->close();

                $nextNumber = $result ? intval(substr($result['userID'], 1)) + 1 : 1;
                $newDriverID = $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

                error_log("Generated new driver ID: $newDriverID from passenger ID: $userID");

                // Delete passenger record
                $deletePassengerQuery = "DELETE FROM passenger WHERE passengerID = ?";
                $stmt = $this->conn->prepare($deletePassengerQuery);
                $stmt->bind_param('s', $userID);
                $stmt->execute();
                $stmt->close();

                // Update userID & role in users table
                $updateUserIDQuery = "UPDATE users SET userID = ?, role = 'driver' WHERE userID = ?";
                $stmt = $this->conn->prepare($updateUserIDQuery);
                $stmt->bind_param('ss', $newDriverID, $userID);
                $updated = $stmt->execute();
                $stmt->close();

                if (!$updated) {
                    throw new Exception('Failed to update user role');
                }

                // Handle image uploads
                $licenseImagePath = !empty($roleData['license_image'])
                    ? $this->saveBase64Image($roleData['license_image'], 'licenses', $newDriverID)
                    : null;

                $profilePicPath = !empty($roleData['profile_photo'])
                    ? $this->saveBase64Image($roleData['profile_photo'], 'profiles', $newDriverID)
                    : null;

                $orcrPhotoPath = !empty($roleData['vehicle_photo'])
                    ? $this->saveBase64Image($roleData['vehicle_photo'], 'orcr', $newDriverID)
                    : null;

                // Update profile picture
                if ($profilePicPath) {
                    $updateProfileQuery = "UPDATE users SET profile_pic = ? WHERE userID = ?";
                    $stmt = $this->conn->prepare($updateProfileQuery);
                    $stmt->bind_param('ss', $profilePicPath, $newDriverID);
                    $stmt->execute();
                    $stmt->close();
                }

                // Insert into driver table
                $driverQuery = "INSERT INTO driver (driverID, license_number, license_type, license_expiry, license_image, license_status, total_rides, average_rating)
                                VALUES (?, ?, ?, ?, ?, 'for_review', 0, 0.00)";
                $stmt = $this->conn->prepare($driverQuery);
                $stmt->bind_param(
                    'sssss',
                    $newDriverID,
                    $roleData['license_number'],
                    $roleData['license_type'],
                    $roleData['license_expiry'],
                    $licenseImagePath
                );
                $driverInserted = $stmt->execute();
                $stmt->close();

                if (!$driverInserted) {
                    throw new Exception('Failed to create driver record');
                }

                // Generate vehicle ID
                $vehicleID = 'V' . substr($newDriverID, 1) . '_' . time();

                // Insert vehicle record
                $vehicleQuery = "INSERT INTO vehicles (vehicleID, driverID, brand, model, color, plate_number, year, seats_available, OR_CR, vehicle_status, created_at, updated_at)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())";
                $stmt = $this->conn->prepare($vehicleQuery);
                $stmt->bind_param(
                    'ssssssiss',
                    $vehicleID,
                    $newDriverID,
                    $roleData['vehicle_brand'],
                    $roleData['vehicle_model'],
                    $roleData['vehicle_color'],
                    strtoupper($roleData['plate_number']),
                    $roleData['vehicle_year'],
                    $roleData['seats_available'],
                    $orcrPhotoPath
                );
                $vehicleInserted = $stmt->execute();
                $stmt->close();

                if (!$vehicleInserted) {
                    throw new Exception('Failed to create vehicle record');
                }

                $this->conn->commit();

                error_log("Driver registration completed successfully - ID: $newDriverID");

                return [
                    'success' => true,
                    'userID' => $newDriverID,
                    'role' => 'driver',
                    'message' => 'Driver registration completed successfully. Your account is pending verification.'
                ];
            } else {
                // ========================================
                // PASSENGER REGISTRATION
                // ========================================

                // Save profile photo if provided
                $profilePicPath = !empty($roleData['profile_photo'])
                    ? $this->saveBase64Image($roleData['profile_photo'], 'profiles', $userID)
                    : null;

                if ($profilePicPath) {
                    $updateProfileQuery = "UPDATE users SET profile_pic = ? WHERE userID = ?";
                    $stmt = $this->conn->prepare($updateProfileQuery);
                    $stmt->bind_param('ss', $profilePicPath, $userID);
                    $stmt->execute();
                    $stmt->close();
                }

                // Update passenger preferred payment
                $updatePassengerQuery = "UPDATE passenger SET preferred_payment = ? WHERE passengerID = ?";
                $stmt = $this->conn->prepare($updatePassengerQuery);
                $stmt->bind_param('ss', $roleData['preferred_payment'], $userID);
                $updated = $stmt->execute();
                $stmt->close();

                if (!$updated) {
                    throw new Exception('Failed to update passenger preferences');
                }

                $this->conn->commit();

                error_log("Passenger registration completed successfully - ID: $userID");

                return [
                    'success' => true,
                    'userID' => $userID,
                    'role' => 'passenger',
                    'message' => 'Passenger registration completed successfully'
                ];
            }
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Role registration error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Save base64 image to file system
     */
    private function saveBase64Image($base64String, $folder, $userID)
    {
        try {
            // Extract image data and type
            if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
                $base64String = substr($base64String, strpos($base64String, ',') + 1);
                $type = strtolower($type[1]);

                // Validate image type
                $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (!in_array($type, $allowedTypes)) {
                    throw new Exception('Invalid image type. Allowed: ' . implode(', ', $allowedTypes));
                }
            } else {
                throw new Exception('Invalid image format');
            }

            // Decode base64
            $imageData = base64_decode($base64String);
            if ($imageData === false) {
                throw new Exception('Base64 decode failed');
            }

            // Validate image size (max 5MB)
            if (strlen($imageData) > 5 * 1024 * 1024) {
                throw new Exception('Image size exceeds 5MB limit');
            }

            // Create upload directory if it doesn't exist
            $uploadDir = __DIR__ . '/../../public/uploads/' . $folder;
            if (!file_exists($uploadDir)) {
                if (!mkdir($uploadDir, 0755, true)) {
                    throw new Exception('Failed to create upload directory');
                }
            }

            // Generate unique filename
            $filename = $userID . '_' . time() . '_' . uniqid() . '.' . $type;
            $filepath = $uploadDir . '/' . $filename;

            // Save file
            if (file_put_contents($filepath, $imageData) === false) {
                throw new Exception('Failed to save image file');
            }

            // Return relative path for database storage
            $relativePath = 'uploads/' . $folder . '/' . $filename;
            error_log("Image saved successfully: $relativePath");

            return $relativePath;
        } catch (Exception $e) {
            error_log("Image save error: " . $e->getMessage());
            throw new Exception('Image upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Get aggregated counts for dashboard
     */
    public function getCounts()
    {
        $counts = [
            'total' => 0,
            'active' => 0,
            'inactive' => 0,
            'suspended' => 0,
            'admin' => 0,
        ];

        // total
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM users");
        $stmt->execute();
        $counts['total'] = (int)$stmt->get_result()->fetch_assoc()['cnt'];
        $stmt->close();

        // active
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM users WHERE status = 'active'");
        $stmt->execute();
        $counts['active'] = (int)$stmt->get_result()->fetch_assoc()['cnt'];
        $stmt->close();

        // suspended
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM users WHERE status = 'suspended'");
        $stmt->execute();
        $counts['suspended'] = (int)$stmt->get_result()->fetch_assoc()['cnt'];
        $stmt->close();

        // inactive: pending_verification + deactivated
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM users WHERE status IN ('pending_verification','deactivated')");
        $stmt->execute();
        $counts['inactive'] = (int)$stmt->get_result()->fetch_assoc()['cnt'];
        $stmt->close();

        // admins
        $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'");
        $stmt->execute();
        $counts['admin'] = (int)$stmt->get_result()->fetch_assoc()['cnt'];
        $stmt->close();

        return $counts;
    }


    /**
     * Get User by ID
     */
    public function getUserById($userID)
    {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE userID = ?");
        $stmt->bind_param("s", $userID);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $result;
    }

    /**
     * Fetch users with filters and pagination
     */
    public function getUsers($filters = [])
    {
        $page = isset($filters['page']) ? (int)$filters['page'] : 1;
        $offset = ($page - 1) * $this->itemsPerPage;

        $query = "SELECT 
                    u.*,
                    CASE 
                        WHEN u.role = 'driver' THEN d.license_status
                        ELSE NULL
                    END AS license_status,
                    CASE 
                        WHEN u.role = 'driver' THEN d.total_rides
                        WHEN u.role = 'passenger' THEN p.total_rides
                        ELSE 0
                    END AS total_rides,
                    CASE 
                        WHEN u.role = 'driver' THEN d.average_rating
                        ELSE NULL
                    END AS average_rating,
                    CASE 
                        WHEN u.role = 'driver' THEN d.verified_by
                        WHEN u.role = 'passenger' THEN p.verified_by
                        ELSE NULL
                    END AS verified_by,
                    CASE 
                        WHEN u.role = 'driver' THEN d.verified_at
                        WHEN u.role = 'passenger' THEN p.verified_at
                        ELSE NULL
                    END AS verified_at
                  FROM users u
                  LEFT JOIN driver d ON u.userID = d.driverID
                  LEFT JOIN passenger p ON u.userID = p.passengerID
                  WHERE 1=1";

        $types = '';
        $params = [];

        // Role filter
        if (!empty($filters['role'])) {
            $query .= " AND LOWER(u.role) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['role'];
        }

        // Status filter
        if (!empty($filters['status'])) {
            $query .= " AND LOWER(u.status) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['status'];
        }

        // Search filter (name, email, userID)
        if (!empty($filters['search'])) {
            $query .= " AND (
                u.first_name LIKE ? OR 
                u.last_name LIKE ? OR 
                CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR
                u.email LIKE ? OR 
                u.userID LIKE ?
            )";
            $types .= 'sssss';
            $search = "%" . $filters['search'] . "%";
            $params = array_merge($params, [$search, $search, $search, $search, $search]);
        }

        // Date verified filter
        if (!empty($filters['date_verified'])) {
            $query .= " AND (
                (u.role = 'driver' AND DATE(d.verified_at) = ?) OR
                (u.role = 'passenger' AND DATE(p.verified_at) = ?)
            )";
            $types .= 'ss';
            $params[] = $filters['date_verified'];
            $params[] = $filters['date_verified'];
        }

        // Sorting
        $sortBy = isset($filters['sort_by']) ? $filters['sort_by'] : 'created_at';
        $sortOrder = isset($filters['sort_order']) && strtoupper($filters['sort_order']) === 'ASC' ? 'ASC' : 'DESC';

        $sortColumn = match ($sortBy) {
            'name' => 'u.first_name',
            'role' => 'u.role',
            'email' => 'u.email',
            'status' => 'u.status',
            'verified_by' => 'verified_by',
            'verified_at' => 'verified_at',
            'last_login' => 'u.last_login',
            default => 'u.created_at'
        };

        $query .= " ORDER BY {$sortColumn} {$sortOrder}";
        $query .= " LIMIT ? OFFSET ?";
        $types .= 'ii';
        $params[] = $this->itemsPerPage;
        $params[] = $offset;

        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        $stmt->close();

        return $users;
    }

    /**
     * Get total count of users (for pagination)
     */
    public function getTotalUsers($filters = [])
    {
        $query = "SELECT COUNT(*) as total
                  FROM users u
                  LEFT JOIN driver d ON u.userID = d.driverID
                  LEFT JOIN passenger p ON u.userID = p.passengerID
                  WHERE 1=1";

        $types = '';
        $params = [];

        if (!empty($filters['role'])) {
            $query .= " AND LOWER(u.role) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['role'];
        }

        if (!empty($filters['status'])) {
            $query .= " AND LOWER(u.status) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $query .= " AND (
                u.first_name LIKE ? OR 
                u.last_name LIKE ? OR 
                CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR
                u.email LIKE ? OR 
                u.userID LIKE ?
            )";
            $types .= 'sssss';
            $search = "%" . $filters['search'] . "%";
            $params = array_merge($params, [$search, $search, $search, $search, $search]);
        }

        if (!empty($filters['date_verified'])) {
            $query .= " AND (
                (u.role = 'driver' AND DATE(d.verified_at) = ?) OR
                (u.role = 'passenger' AND DATE(p.verified_at) = ?)
            )";
            $types .= 'ss';
            $params[] = $filters['date_verified'];
            $params[] = $filters['date_verified'];
        }

        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        return (int)$result['total'];
    }

    /**
     * Get all users for export (no pagination)
     * This method is called by the controller for CSV export
     */
    public function getAllUsersForExport($filters)
    {
        $query = "SELECT 
                    u.*,
                    CASE 
                        WHEN u.role = 'driver' THEN d.verified_by
                        WHEN u.role = 'passenger' THEN p.verified_by
                        ELSE NULL
                    END AS verified_by,
                    CASE 
                        WHEN u.role = 'driver' THEN d.verified_at
                        WHEN u.role = 'passenger' THEN p.verified_at
                        ELSE NULL
                    END AS verified_at
                  FROM users u
                  LEFT JOIN driver d ON u.userID = d.driverID
                  LEFT JOIN passenger p ON u.userID = p.passengerID
                  WHERE 1=1";

        $types = '';
        $params = [];

        if (!empty($filters['role'])) {
            $query .= " AND LOWER(u.role) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['role'];
        }

        if (!empty($filters['status'])) {
            $query .= " AND LOWER(u.status) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $query .= " AND (
                u.first_name LIKE ? OR 
                u.last_name LIKE ? OR 
                CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR
                u.email LIKE ? OR 
                u.userID LIKE ?
            )";
            $types .= 'sssss';
            $search = "%" . $filters['search'] . "%";
            $params = array_merge($params, [$search, $search, $search, $search, $search]);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = isset($filters['sort_order']) && strtoupper($filters['sort_order']) === 'ASC' ? 'ASC' : 'DESC';

        $sortColumn = match ($sortBy) {
            'name' => 'u.first_name',
            'role' => 'u.role',
            'email' => 'u.email',
            'status' => 'u.status',
            'verified_by' => 'verified_by',
            'verified_at' => 'verified_at',
            'last_login' => 'u.last_login',
            default => 'u.created_at'
        };

        $query .= " ORDER BY {$sortColumn} {$sortOrder}";

        $stmt = $this->conn->prepare($query);

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        $stmt->close();

        return $users;
    }

    /**
     * Get user statistics
     */
    public function getUserStats()
    {
        $query = "SELECT 
                    COUNT(*) AS total_users,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_users,
                    SUM(CASE WHEN status IN ('pending_verification', 'deactivated') THEN 1 ELSE 0 END) AS inactive_users,
                    SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_users,
                    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_users
                  FROM users";
        $result = $this->conn->query($query);
        return $result->fetch_assoc();
    }

    /**
     * Get user signups grouped by month 
     */
    public function getUserGrowth($months = 6)
    {
        $months = max(1, (int)$months);
        // Determine the last month
        $lastMonth = null;
        $stmt = $this->conn->prepare("SELECT DATE_FORMAT(MAX(created_at), '%Y-%m') AS last_ym FROM users");
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!empty($res) && !empty($res['last_ym'])) {
            $lastMonth = $res['last_ym'];
        } else {
            // fallback to current month
            $lastMonth = (new DateTime('first day of this month'))->format('Y-m');
        }

        // Build month keys (YYYY-MM) ending at $lastMonth
        $labels = [];
        $monthKeys = [];

        $dt = DateTime::createFromFormat('Y-m-d', $lastMonth . '-01');
        if (!$dt) {
            $dt = new DateTime('first day of this month');
        }

        // move to the start month (months-1 months before lastMonth)
        $dt->modify('-' . ($months - 1) . ' months');

        for ($i = 0; $i < $months; $i++) {
            $key = $dt->format('Y-m');
            $labels[] = $dt->format('M');
            $monthKeys[] = $key;
            $dt->modify('+1 month');
        }

        $startDate = $monthKeys[0] . '-01';

        $query = "SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt
                  FROM users
                  WHERE created_at >= ?
                  GROUP BY ym
                  ORDER BY ym ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $result = $stmt->get_result();

        $map = [];
        while ($row = $result->fetch_assoc()) {
            $map[$row['ym']] = (int)$row['cnt'];
        }
        $stmt->close();

        $counts = [];
        foreach ($monthKeys as $k) {
            $counts[] = $map[$k] ?? 0;
        }

        return ['labels' => $labels, 'counts' => $counts, 'keys' => $monthKeys];
    }

    /**
     * Update user status
     */
    public function updateUserStatus($userID, $status)
    {
        $validStatuses = ['active', 'suspended', 'pending_verification', 'deactivated'];
        if (!in_array($status, $validStatuses)) {
            return ['success' => false, 'message' => 'Invalid status'];
        }

        $stmt = $this->conn->prepare("UPDATE users SET status = ?, updated_at = NOW() WHERE userID = ?");
        $stmt->bind_param("ss", $status, $userID);
        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'User status updated successfully' : 'Failed to update user status'
        ];
    }

    /**
     * Get user details with role-specific information
     */
    public function getUserDetails($userID)
    {
        $query = "SELECT u.*, 
                         d.license_number, d.license_type, d.license_expiry, d.license_status, 
                         d.total_rides AS driver_rides, d.average_rating,
                         p.preferred_payment, p.total_rides AS passenger_rides,
                         v.brand, v.model, v.plate_number, v.color, v.year
                  FROM users u
                  LEFT JOIN driver d ON u.userID = d.driverID
                  LEFT JOIN passenger p ON u.userID = p.passengerID
                  LEFT JOIN vehicles v ON d.driverID = v.driverID
                  WHERE u.userID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $userID);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $result;
    }

    /**
     * Delete user
     */
    public function deleteUser($userID)
    {
        $this->conn->begin_transaction();
        try {
            $stmt = $this->conn->prepare("SELECT role FROM users WHERE userID = ?");
            $stmt->bind_param("s", $userID);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$user) {
                throw new Exception('User not found');
            }

            if ($user['role'] === 'driver') {
                $stmt = $this->conn->prepare("DELETE FROM driver WHERE driverID = ?");
                $stmt->bind_param("s", $userID);
                $stmt->execute();
                $stmt->close();
            } elseif ($user['role'] === 'passenger') {
                $stmt = $this->conn->prepare("DELETE FROM passenger WHERE passengerID = ?");
                $stmt->bind_param("s", $userID);
                $stmt->execute();
                $stmt->close();
            }

            $stmt = $this->conn->prepare("DELETE FROM users WHERE userID = ?");
            $stmt->bind_param("s", $userID);
            $stmt->execute();
            $stmt->close();

            $this->conn->commit();
            return ['success' => true, 'message' => 'User deleted successfully'];
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    /**
     * Add User
     */
    public function addUser($data)
    {
        $this->conn->begin_transaction();
        try {
            $role = strtolower($data['role'] ?? 'passenger');
            $first = trim($data['first_name']);
            $last = trim($data['last_name'] ?? '');
            $email = trim($data['email']);
            $passwordHash = password_hash('default123', PASSWORD_DEFAULT);

            $prefixMap = ['driver' => 'D', 'admin' => 'A', 'passenger' => 'P'];
            $prefix = $prefixMap[$role] ?? 'U';

            $stmt = $this->conn->prepare("SELECT userID FROM users WHERE userID LIKE CONCAT(?, '%') ORDER BY userID DESC LIMIT 1");
            $stmt->bind_param("s", $prefix);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            $nextNumber = $result ? intval(substr($result['userID'], 1)) + 1 : 1;
            $newID = $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            $insertUser = "INSERT INTO users (userID, first_name, last_name, email, password_hash, role, status, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())";
            $stmt = $this->conn->prepare($insertUser);
            $stmt->bind_param("ssssss", $newID, $first, $last, $email, $passwordHash, $role);
            $stmt->execute();
            $stmt->close();

            if ($role === 'driver') {
                $stmt = $this->conn->prepare("INSERT INTO driver (driverID, license_status, total_rides, average_rating)
                                              VALUES (?, 'unsubmitted', 0, 0.00)");
                $stmt->bind_param("s", $newID);
                $stmt->execute();
                $stmt->close();
            } elseif ($role === 'passenger') {
                $stmt = $this->conn->prepare("INSERT INTO passenger (passengerID, preferred_payment, total_rides)
                                              VALUES (?, 'cash', 0)");
                $stmt->bind_param("s", $newID);
                $stmt->execute();
                $stmt->close();
            } elseif ($role === 'admin') {
                $stmt = $this->conn->prepare("INSERT INTO admin (adminID, admin_level)
                                              VALUES (?, 'admin')");
                $stmt->bind_param("s", $newID);
                $stmt->execute();
                $stmt->close();
            }

            $this->conn->commit();

            return ['success' => true, 'userID' => $newID, 'message' => ucfirst($role) . " user added successfully"];
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error adding user: ' . $e->getMessage()];
        }
    }

    /**
     * Edit User
     */
    public function editUser($data)
    {
        $stmt = $this->conn->prepare("UPDATE users 
                                      SET first_name = ?, last_name = ?, email = ?, role = ? 
                                      WHERE userID = ?");
        $stmt->bind_param("sssss", $data['first_name'], $data['last_name'], $data['email'], $data['role'], $data['userID']);
        $success = $stmt->execute();
        $stmt->close();
        return $success;
    }

    /**
     * Get items per page
     */
    public function getItemsPerPage()
    {
        return $this->itemsPerPage;
    }
}
