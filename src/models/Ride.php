<?php
require_once __DIR__ . '/../config/config.php';

class Ride
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Get active rides with optional filtering
     * @param string $search Search term for ride ID, driver name, origin, or destination
     * @param string $status Filter by specific status
     * @return array Array of active rides
     */
    public function getActiveRides($search = '', $status = '')
    {
        $sql = "
            SELECT r.rideID,
                   CONCAT(u.first_name, ' ', u.last_name) AS driver,
                   r.origin,
                   r.destination,
                   r.departure_time,
                   r.estimated_arrival,
                   r.total_seats,
                   r.status,
                   v.seats_available
            FROM rides r
            INNER JOIN vehicles v ON r.vehicleID = v.vehicleID
            INNER JOIN users u ON r.userID = u.userID
            WHERE 1=1
        ";
        $types = '';
        $bindParams = [];

        // Add status filter
        if (!empty($status)) {
            $sql .= " AND r.status = ?";
            $types .= 's';
            $bindParams[] = $status;
        } else {
            // Default: show only active statuses
            $sql .= " AND r.status IN ('accepted', 'waiting_pickup', 'en_route', 'ongoing')";
        }

        // Add search filter
        if (!empty($search)) {
            $sql .= " AND (
                r.rideID LIKE ? OR
                CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR
                r.origin LIKE ? OR
                r.destination LIKE ?
            )";
            $like = '%' . $search . '%';
            $types .= 'ssss';
            $bindParams = array_merge($bindParams, [$like, $like, $like, $like]);
        }

        $sql .= " ORDER BY r.departure_time ASC";

        $stmt = $this->conn->prepare($sql);
        if ($stmt === false) {
            return [];
        }

        if ($types !== '') {
            $stmt->bind_param($types, ...$bindParams);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];
        if ($result) {
            while ($r = $result->fetch_assoc()) {
                $rows[] = $r;
            }
        }
        $stmt->close();
        return $rows;
    }

    /**
     * Get statistics for ride statuses
     * @return array Counts for each status
     */
    public function getRideStats()
    {
        $sql = "
            SELECT 
                SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
                SUM(CASE WHEN status = 'en_route' OR status = 'waiting_pickup' THEN 1 ELSE 0 END) as en_route,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM rides
            WHERE status IN ('accepted', 'waiting_pickup', 'en_route', 'ongoing', 'completed')
        ";

        $res = $this->conn->query($sql);
        $row = $res ? $res->fetch_assoc() : null;

        return [
            'ongoing' => (int)($row['ongoing'] ?? 0),
            'en_route' => (int)($row['en_route'] ?? 0),
            'accepted' => (int)($row['accepted'] ?? 0),
            'completed' => (int)($row['completed'] ?? 0)
        ];
    }

    /**
     * Get ride activity for the last 7 days (per day, not weekday)
     * @return array ['labels' => [...], 'counts' => [...]]
     */
    public function getActivityLast7Days()
    {
        $labels = [];
        $counts = [];
        $dateKeys = [];
        $today = new DateTime();
        $today->setTime(0, 0, 0);
        for ($i = 6; $i >= 0; $i--) {
            $dt = clone $today;
            $dt->modify("-$i days");
            $labels[] = $dt->format('M j');
            $dateKeys[] = $dt->format('Y-m-d');
        }

        // Query for ride counts per day
        $startDate = $dateKeys[0] . ' 00:00:00';
        $endDate = $dateKeys[6] . ' 23:59:59';
        $sql = "SELECT DATE(departure_time) as d, COUNT(*) as cnt FROM rides WHERE departure_time BETWEEN ? AND ? GROUP BY d";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ss', $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        $map = [];
        while ($row = $result->fetch_assoc()) {
            $map[$row['d']] = (int)$row['cnt'];
        }
        $stmt->close();

        foreach ($dateKeys as $d) {
            $counts[] = $map[$d] ?? 0;
        }

        return ['labels' => $labels, 'counts' => $counts, 'keys' => $dateKeys];
    }

    /**
     * Get a single ride by ID
     * @param int $rideID
     * @return array|null Ride data or null if not found
     */
    public function getRideById($rideID)
    {
        $sql = "
            SELECT r.*,
                   CONCAT(u.first_name, ' ', u.last_name) AS driver,
                   u.phone_number as driver_phone,
                   v.seats_available,
                   v.plate_number,
                   v.vehicle_model
            FROM rides r
            INNER JOIN vehicles v ON r.vehicleID = v.vehicleID
            INNER JOIN users u ON r.userID = u.userID
            WHERE r.rideID = :rideID
        ";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return null;
        $stmt->bind_param('s', $rideID);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result ? $result->fetch_assoc() : null;
        $stmt->close();
        return $row;
    }

    /**
     * Update ride status
     * @param int $rideID
     * @param string $newStatus
     * @return bool Success status
     */
    public function updateRideStatus($rideID, $newStatus)
    {
        $sql = "UPDATE rides SET status = ? WHERE rideID = ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return false;
        $stmt->bind_param('ss', $newStatus, $rideID);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }
}