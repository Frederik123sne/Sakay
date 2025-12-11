<?php
require_once __DIR__ . '/../config/config.php';

class Report
{
    private $conn;
    private $itemsPerPage = 10;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Fetch reports with filters + pagination
     */
    public function getReports($filters = [])
    {
        $page = isset($filters['page']) ? (int)$filters['page'] : 1;
        $offset = ($page - 1) * $this->itemsPerPage;

        $query = "
    SELECT r.*,
           reporter.first_name AS reporter_first_name,
           reporter.last_name AS reporter_last_name,
           reporter.email AS reporter_email,
           reporter.profile_pic AS reporter_profile_pic,
           reported.first_name AS reported_first_name,
           reported.last_name AS reported_last_name,
           reported.email AS reported_email,
           reported.profile_pic AS reported_profile_pic
    FROM reports r
    LEFT JOIN users reporter ON r.reporter_userID = reporter.userID
    LEFT JOIN users reported ON r.reported_userID = reported.userID
    WHERE 1=1
";

        $types = '';
        $params = [];

        // Report type filter
        if (!empty($filters['type'])) {
            $query .= " AND LOWER(r.report_type) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['type'];
        }

        // Status filter
        if (!empty($filters['status'])) {
            $query .= " AND LOWER(r.status) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['status'];
        }

        // Date range filter
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query .= " AND DATE(r.created_at) BETWEEN ? AND ?";
            $types .= 'ss';
            $params[] = $filters['start_date'];
            $params[] = $filters['end_date'];
        }

        // Search filter (search both reporter and reported)
        if (!empty($filters['search'])) {
            $search = "%" . $filters['search'] . "%";
            $query .= " AND (
                r.reportID LIKE ? OR
                reporter.first_name LIKE ? OR reporter.last_name LIKE ? OR reporter.email LIKE ? OR
                reported.first_name LIKE ? OR reported.last_name LIKE ? OR reported.email LIKE ?
            )";
            $types .= 'sssssss';
            $params = array_merge($params, [$search, $search, $search, $search, $search, $search, $search]);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'r.created_at';
        $sortOrder = strtoupper($filters['sort_order'] ?? 'DESC');
        $query .= " ORDER BY {$sortBy} {$sortOrder}";

        // Pagination
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

        $reports = [];
        while ($row = $result->fetch_assoc()) {
            $reports[] = $row;
        }

        $stmt->close();
        return $reports;
    }

    /**
     * Count reports for pagination
     */
    public function getTotalReports($filters = [])
    {
        $query = "
            SELECT COUNT(*) AS total
            FROM reports r
            LEFT JOIN users reporter ON r.reporter_userID = reporter.userID
            LEFT JOIN users reported ON r.reported_userID = reported.userID
            WHERE 1=1
        ";

        $types = '';
        $params = [];

        if (!empty($filters['type'])) {
            $query .= " AND LOWER(r.report_type) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['type'];
        }

        if (!empty($filters['status'])) {
            $query .= " AND LOWER(r.status) = LOWER(?)";
            $types .= 's';
            $params[] = $filters['status'];
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query .= " AND DATE(r.created_at) BETWEEN ? AND ?";
            $types .= 'ss';
            $params[] = $filters['start_date'];
            $params[] = $filters['end_date'];
        }

        if (!empty($filters['search'])) {
            $search = "%" . $filters['search'] . "%";
            $query .= " AND (
                r.reportID LIKE ? OR
                reporter.first_name LIKE ? OR reporter.last_name LIKE ? OR reporter.email LIKE ? OR
                reported.first_name LIKE ? OR reported.last_name LIKE ? OR reported.email LIKE ?
            )";
            $types .= 'sssssss';
            $params = array_merge($params, [$search, $search, $search, $search, $search, $search, $search]);
        }

        $stmt = $this->conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $total = $result->fetch_assoc()['total'] ?? 0;
        $stmt->close();

        return (int)$total;
    }

    /**
     * Dashboard summary stats
     */
    public function getReportStats()
    {
        $query = "
            SELECT 
                COUNT(*) AS total_reports,
                SUM(status = 'pending') AS pending_reports,
                SUM(status = 'reviewed') AS reviewed_reports,
                SUM(status = 'resolved') AS resolved_reports
            FROM reports
        ";

        $result = $this->conn->query($query);
        return $result->fetch_assoc();
    }

    /**
     * Add a new report
     */
    public function addReport($data)
    {
        $stmt = $this->conn->prepare("
            INSERT INTO reports (reportID, reporter_userID, reported_userID, report_type, subject, rideID, description, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->bind_param(
            'sssssss',
            $data['reportID'],
            $data['reporter_userID'],
            $data['reported_userID'],
            $data['report_type'],
            $data['subject'],
            $data['rideID'],
            $data['description']
        );

        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Report submitted successfully.' : 'Failed to submit report.'
        ];
    }

    /**
     * Update report status
     */
    public function updateReportStatus($reportID, $status)
    {
        $valid = ['pending', 'reviewed', 'resolved'];
        if (!in_array($status, $valid)) {
            return ['success' => false, 'message' => 'Invalid status'];
        }

        $query = "UPDATE reports SET status = ?, resolved_at = IF(? = 'resolved', NOW(), resolved_at) WHERE reportID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('sss', $status, $status, $reportID);
        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Report status updated.' : 'Failed to update report status.'
        ];
    }

    /**
     * Delete report
     */
    public function deleteReport($reportID)
    {
        $stmt = $this->conn->prepare("DELETE FROM reports WHERE reportID = ?");
        $stmt->bind_param('s', $reportID);
        $success = $stmt->execute();
        $stmt->close();

        return [
            'success' => $success,
            'message' => $success ? 'Report deleted successfully.' : 'Failed to delete report.'
        ];
    }

    public function getItemsPerPage()
    {
        return $this->itemsPerPage;
    }
}
?>
