<?php
require_once __DIR__ . '/../config/config.php';

class Payment
{
    private $conn;

    public function __construct()
    {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Get all payments with optional search and status filters
     */
    public function getAllPayments($search = '', $status = '')
    {
        $query = "
            SELECT 
                p.paymentID,
                p.bookingID,
                p.payment_method,
                p.amount,
                p.status,
                p.payment_date,
                p.transaction_reference
            FROM payment p
            WHERE 1=1
        ";

        $params = [];
        if (!empty($search)) {
            $query .= " AND (
                p.paymentID LIKE ?
                OR p.bookingID LIKE ?
                OR p.transaction_reference LIKE ?
            )";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }

        if (!empty($status)) {
            $query .= " AND p.status = ?";
            $params[] = $status;
        }

        $query .= " ORDER BY p.payment_date DESC";

        $stmt = $this->conn->prepare($query);
        if ($params) {
            $types = str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Get comprehensive payment statistics for dashboard
     */
    public function getPaymentStats()
    {
        $query = "
            SELECT
                COUNT(*) AS total_transactions,
                COALESCE(SUM(amount), 0) AS total_revenue,
                SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_payments,
                SUM(CASE WHEN status='refunded' THEN 1 ELSE 0 END) AS refunded_payments,
                COALESCE(SUM(CASE
                    WHEN status='paid' 
                         AND MONTH(payment_date) = MONTH(CURRENT_DATE())
                         AND YEAR(payment_date) = YEAR(CURRENT_DATE())
                    THEN amount ELSE 0 END), 0) AS monthly_revenue,
                COALESCE(AVG(CASE WHEN status='paid' THEN amount END), 0) AS avg_payment,
                COALESCE(SUM(CASE WHEN status='paid' THEN amount END) * 0.10, 0) AS total_commission
            FROM payment
        ";
        $result = $this->conn->query($query);
        $row = $result->fetch_assoc();

        return [
            'total_transactions' => (int)$row['total_transactions'],
            'total_revenue' => (float)$row['total_revenue'],
            'pending_payments' => (int)$row['pending_payments'],
            'refunded_payments' => (int)$row['refunded_payments'],
            'monthly_revenue' => (float)$row['monthly_revenue'],
            'avg_payment' => (float)$row['avg_payment'],
            'total_commission' => (float)$row['total_commission']
        ];
    }

    /**
     * Get payment method breakdown
     */
    public function getPaymentBreakdown($search = '')
    {
        $query = "
            SELECT 
                payment_method,
                COUNT(*) AS transaction_count,
                COALESCE(SUM(amount), 0) AS total_amount
            FROM payment
            WHERE status = 'paid'
        ";

        $params = [];
        if (!empty($search)) {
            $query .= " AND (
                paymentID LIKE ?
                OR bookingID LIKE ?
                OR transaction_reference LIKE ?
            )";
            $searchParam = "%$search%";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
        }

        $query .= " GROUP BY payment_method ORDER BY transaction_count DESC";

        $stmt = $this->conn->prepare($query);
        if ($params) {
            $types = str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = $result->fetch_all(MYSQLI_ASSOC);

        return array_filter($rows, fn($r) => !empty($r['payment_method']) && $r['transaction_count'] > 0);
    }

    /**
     * Get monthly revenue trend
     */
    public function getMonthlyRevenueTrend($months = 6)
    {
        $query = "
            SELECT 
                DATE_FORMAT(payment_date, '%Y-%m') AS month,
                COALESCE(SUM(amount), 0) AS revenue,
                COUNT(*) AS transaction_count
            FROM payment
            WHERE status = 'paid'
                AND payment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
            ORDER BY month ASC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $months);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Get payment by ID
     */
    public function getPaymentById($paymentID)
    {
        $query = "
            SELECT 
                p.*,
                b.userID,
                b.rideID
            FROM payment p
            LEFT JOIN booking b ON p.bookingID = b.bookingID
            WHERE p.paymentID = ?
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('s', $paymentID);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Update payment status
     */
    public function updatePaymentStatus($paymentID, $newStatus)
    {
        $query = "UPDATE payment SET status = ? WHERE paymentID = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('ss', $newStatus, $paymentID);
        return $stmt->execute();
    }

    /**
     * Get top earning drivers
     */
    public function getTopEarningDrivers($limit = 5)
    {
        $query = "
            SELECT 
                u.userID,
                CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                COUNT(DISTINCT p.paymentID) AS total_rides,
                COALESCE(SUM(p.amount), 0) AS total_earnings
            FROM payment p
            INNER JOIN booking b ON p.bookingID = b.bookingID
            INNER JOIN rides r ON b.rideID = r.rideID
            INNER JOIN users u ON r.userID = u.userID
            WHERE p.status = 'paid'
            GROUP BY u.userID, driver_name
            ORDER BY total_earnings DESC
            LIMIT ?
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param('i', $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Get monthly transaction data for the specified year
     * Returns array with month numbers as keys and transaction/revenue data as values
     */
    public function getMonthlyTransactionData($year = null)
    {
        if ($year === null) {
            $year = date('Y');
        }

        // Initialize all months with zero values
        $monthlyData = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyData[$i] = [
                'transactions' => 0,
                'revenue' => 0
            ];
        }

        // Prepare MySQLi query
        $query = "SELECT 
                    MONTH(payment_date) AS month,
                    COUNT(*) AS transactions,
                    COALESCE(SUM(amount), 0) AS revenue
                  FROM payment
                  WHERE YEAR(payment_date) = ?
                    AND status = 'paid'
                  GROUP BY MONTH(payment_date)
                  ORDER BY MONTH(payment_date)";

        if ($stmt = $this->conn->prepare($query)) {
            $stmt->bind_param('i', $year);

            if ($stmt->execute()) {
                $result = $stmt->get_result();

                while ($row = $result->fetch_assoc()) {
                    $month = (int)$row['month'];
                    $monthlyData[$month] = [
                        'transactions' => (int)$row['transactions'],
                        'revenue' => (float)$row['revenue']
                    ];
                }
            } else {
                error_log("MySQLi execute error: " . $stmt->error);
            }

            $stmt->close();
        } else {
            error_log("MySQLi prepare error: " . $this->conn->error);
        }

        return $monthlyData;
    }
}
