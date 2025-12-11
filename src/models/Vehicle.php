<?php
require_once __DIR__ . '/../config/config.php';

class Vehicle
{
    private $conn;
    private $itemsPerPage = 10;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Fetch vehicles with filters
     */
    public function getVehicles($filters = [])
    {
        $page = isset($filters['page']) ? (int)$filters['page'] : 1;
        $offset = ($page - 1) * $this->itemsPerPage;

        $query = "
            SELECT v.*, 
                   CONCAT(u.first_name, ' ', u.last_name) AS driver_full_name,
                   u.email AS driver_email,
                   d.license_number,
                   d.license_status,
                   verifier.first_name AS verified_by_name
            FROM vehicles v
            LEFT JOIN driver d ON v.driverID = d.driverID
            LEFT JOIN users u ON d.driverID = u.userID
            LEFT JOIN users verifier ON v.verified_by = verifier.userID
            WHERE 1=1
        ";

        $types = '';
        $params = [];

        if (!empty($filters['status'])) {
            $query .= " AND v.vehicle_status = ?";
            $types .= 's';
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $search = "%" . $filters['search'] . "%";
            $query .= " AND (v.plate_number LIKE ? OR v.brand LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
            $types .= 'ssss';
            $params = array_merge($params, [$search, $search, $search, $search]);
        }

        $sortBy = $filters['sort_by'] ?? 'v.created_at';
        $sortOrder = strtoupper($filters['sort_order'] ?? 'DESC');
        $query .= " ORDER BY {$sortBy} {$sortOrder} LIMIT ? OFFSET ?";
        $types .= 'ii';
        $params[] = $this->itemsPerPage;
        $params[] = $offset;

        $stmt = $this->conn->prepare($query);
        if (!empty($params)) $stmt->bind_param($types, ...$params);

        $stmt->execute();
        $result = $stmt->get_result();
        $vehicles = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        return $vehicles;
    }

    /**
     * Get total count
     */
    public function getTotalVehicles($filters = [])
    {
        $query = "
            SELECT COUNT(*) AS total
            FROM vehicles v
            LEFT JOIN driver d ON v.driverID = d.driverID
            LEFT JOIN users u ON d.driverID = u.userID
            WHERE 1=1
        ";

        $types = '';
        $params = [];

        if (!empty($filters['status'])) {
            $query .= " AND v.vehicle_status = ?";
            $types .= 's';
            $params[] = $filters['status'];
        }

        if (!empty($filters['search'])) {
            $search = "%" . $filters['search'] . "%";
            $query .= " AND (v.plate_number LIKE ? OR v.brand LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";
            $types .= 'ssss';
            $params = array_merge($params, [$search, $search, $search, $search]);
        }

        $stmt = $this->conn->prepare($query);
        if (!empty($params)) $stmt->bind_param($types, ...$params);

        $stmt->execute();
        $result = $stmt->get_result();
        $total = $result->fetch_assoc()['total'] ?? 0;
        $stmt->close();

        return (int)$total;
    }

    /**
     * Add new vehicle
     */
    public function addVehicle($data)
    {
        $stmt = $this->conn->prepare("
            INSERT INTO vehicles (vehicleID, driverID, brand, model, plate_number, color, year, seats_available, OR_CR)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param(
            'sssssssis',
            $data['vehicleID'],
            $data['driverID'],
            $data['brand'],
            $data['model'],
            $data['plate_number'],
            $data['color'],
            $data['year'],
            $data['seats_available'],
            $data['OR_CR']
        );

        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Vehicle added successfully.' : 'Failed to add vehicle.'
        ];
    }

    /**
     * Edit vehicle details
     */
    public function editVehicle($data)
    {
        $stmt = $this->conn->prepare("
            UPDATE vehicles 
            SET brand = ?, model = ?, plate_number = ?, color = ?, year = ?, seats_available = ?, OR_CR = ?
            WHERE vehicleID = ?
        ");

        $stmt->bind_param(
            'sssssi ss',
            $data['brand'],
            $data['model'],
            $data['plate_number'],
            $data['color'],
            $data['year'],
            $data['seats_available'],
            $data['OR_CR'],
            $data['vehicleID']
        );

        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Vehicle updated successfully.' : 'Failed to update vehicle.'
        ];
    }

    /**
     * Delete vehicle
     */
    public function deleteVehicle($vehicleID)
    {
        $stmt = $this->conn->prepare("DELETE FROM vehicles WHERE vehicleID = ?");
        $stmt->bind_param('s', $vehicleID);
        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Vehicle deleted successfully.' : 'Failed to delete vehicle.'
        ];
    }

    /**
     * Update vehicle status
     */
    public function updateVehicleStatus($vehicleID, $status)
    {
        $valid = ['active', 'expired', 'for_renewal', 'renewed', 'rejected', 'cancelled'];
        if (!in_array($status, $valid)) {
            return ['success' => false, 'message' => 'Invalid status'];
        }

        $stmt = $this->conn->prepare("UPDATE vehicles SET vehicle_status = ?, verified_at = IF(? = 'renewed', NOW(), verified_at) WHERE vehicleID = ?");
        $stmt->bind_param('sss', $status, $status, $vehicleID);
        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Vehicle status updated.' : 'Failed to update status.'
        ];
    }

    /**
     * Get vehicle + driver details for pop-up view
     */
    public function getVehicleDetails($vehicleID)
    {
        $stmt = $this->conn->prepare("
            SELECT v.*, 
                   d.license_number, d.license_expiry, d.license_type, d.license_status, 
                   CONCAT(u.first_name, ' ', u.last_name) AS driver_full_name,
                   u.email AS driver_email,
                   u.profile_pic AS driver_profile_pic
            FROM vehicles v
            LEFT JOIN driver d ON v.driverID = d.driverID
            LEFT JOIN users u ON d.driverID = u.userID
            WHERE v.vehicleID = ?
        ");
        $stmt->bind_param('s', $vehicleID);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        return $result;
    }

    public function getAllVehiclesForExport($filters = [])
    {
        $filters['page'] = 1; // no pagination
        $this->itemsPerPage = PHP_INT_MAX;
        return $this->getVehicles($filters);
    }

    public function getItemsPerPage() {
         return $this->itemsPerPage; 
    }

    public function getVehicleStats()
{
    $stats = [
        'total' => 0,
        'active' => 0,
        'for_renewal' => 0,
        'renewed' => 0,
        'expired' => 0,
        'cancelled' => 0,
        'rejected' => 0
    ];

    $query = "
        SELECT vehicle_status, COUNT(*) AS count
        FROM vehicles
        GROUP BY vehicle_status
    ";

    $result = $this->conn->query($query);

    while ($row = $result->fetch_assoc()) {
        $status = $row['vehicle_status'];
        $count = (int)$row['count'];
        if (isset($stats[$status])) {
            $stats[$status] = $count;
        }
        $stats['total'] += $count;
    }

        return $stats;
    }

    /**
     * Get vehicles matching any of the given statuses
     * @param array $statuses
     * @param array $filters (optional) supports 'limit' and 'page'
     * @return array
     */
    public function getVehiclesByStatuses($statuses = [], $filters = [])
    {
        if (empty($statuses) || !is_array($statuses)) return [];

        $placeholders = implode(',', array_fill(0, count($statuses), '?'));
        $query = "
            SELECT v.*, 
                   CONCAT(u.first_name, ' ', u.last_name) AS driver_full_name,
                   u.email AS driver_email,
                   d.license_number,
                   d.license_status,
                   verifier.first_name AS verified_by_name
            FROM vehicles v
            LEFT JOIN driver d ON v.driverID = d.driverID
            LEFT JOIN users u ON d.driverID = u.userID
            LEFT JOIN users verifier ON v.verified_by = verifier.userID
            WHERE v.vehicle_status IN ($placeholders)
        ";

        $types = '';
        $params = [];
        foreach ($statuses as $s) {
            $types .= 's';
            $params[] = $s;
        }

        // simple pagination support
        $limit = isset($filters['limit']) ? (int)$filters['limit'] : $this->itemsPerPage;
        $page = isset($filters['page']) ? (int)$filters['page'] : 1;
        $offset = ($page - 1) * $limit;

        $query .= " ORDER BY v.created_at DESC LIMIT ? OFFSET ?";
        $types .= 'ii';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $this->conn->prepare($query);
        if ($stmt === false) return [];
        $stmt->bind_param($types, ...$params);

        $stmt->execute();
        $result = $stmt->get_result();
        $vehicles = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        return $vehicles;
    }
}
