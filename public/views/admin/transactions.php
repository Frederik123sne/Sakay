<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../../src/controllers/admin/TransactionController.php';

// Initialize controller
$controller = new TransactionController();

// Transaction summary stats
$stats = $controller->getPaymentStats();

// Handle search if present
$searchTerm = $_GET['search'] ?? '';
$paymentBreakdown = !empty($searchTerm) 
    ? $controller->getPaymentBreakdown($searchTerm) 
    : $controller->getPaymentBreakdown();

// Get monthly transaction data for the current year
$monthlyTransactionData = $controller->getMonthlyTransactionData();

// Transform data for JavaScript - convert numeric months to month names
$monthlyDataForJS = [
    'Jan' => $monthlyTransactionData[1] ?? ['transactions' => 0, 'revenue' => 0],
    'Feb' => $monthlyTransactionData[2] ?? ['transactions' => 0, 'revenue' => 0],
    'Mar' => $monthlyTransactionData[3] ?? ['transactions' => 0, 'revenue' => 0],
    'Apr' => $monthlyTransactionData[4] ?? ['transactions' => 0, 'revenue' => 0],
    'May' => $monthlyTransactionData[5] ?? ['transactions' => 0, 'revenue' => 0],
    'Jun' => $monthlyTransactionData[6] ?? ['transactions' => 0, 'revenue' => 0],
    'Jul' => $monthlyTransactionData[7] ?? ['transactions' => 0, 'revenue' => 0],
    'Aug' => $monthlyTransactionData[8] ?? ['transactions' => 0, 'revenue' => 0],
    'Sep' => $monthlyTransactionData[9] ?? ['transactions' => 0, 'revenue' => 0],
    'Oct' => $monthlyTransactionData[10] ?? ['transactions' => 0, 'revenue' => 0],
    'Nov' => $monthlyTransactionData[11] ?? ['transactions' => 0, 'revenue' => 0],
    'Dec' => $monthlyTransactionData[12] ?? ['transactions' => 0, 'revenue' => 0]
];

// Calculate Y-axis max dynamically
$maxRevenue = 0;
foreach ($monthlyDataForJS as $data) {
    if ($data['revenue'] > $maxRevenue) {
        $maxRevenue = $data['revenue'];
    }
}

// Round up to nearest 500, with minimum of 2000
$yAxisMax = $maxRevenue > 0 ? (ceil($maxRevenue / 500) * 500) : 2000;
if ($yAxisMax < 2000) {
    $yAxisMax = 2000;
}

// Encode for JS
$monthlyDataJson = json_encode($monthlyDataForJS);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transactions</title>
    <link rel="stylesheet" href="../admin/css/admin.css">
    <link rel="icon" type="image/x-icon" href="../assets/Logo.png">
</head>
<body>
<div class="sidebar">
    <div class="logo-container">
        <img src="../assets/SAKAY BRAVO LOGO_DARK YELLOW.png" class="app-logo" alt="Logo">
    </div>
    <a href="adminDashboard.php">Dashboard</a>
    <a href="user_management.php">User Management</a>
    <a href="vehicle_registration.php">Vehicle Registration</a>
    <a href="active_rides.php">Active Rides</a>
    <a class="active" href="transactions.php">Transactions</a>
    <a href="reports.php">Reports and Complaints</a>
    <div class="settings">
        <a href="system_settings.php" class="settings">Settings</a>
    </div>
</div>

<header class="top-nav">
    <div class="nav-left">
        <h1 class="nav-title">Transactions</h1>
        <h2 class="sub-title">Monitor and manage activities</h2>
    </div>
    <div class="nav-right">
        <div class="icon notification">
            <img src="../assets/Notification Icon.png" alt="Notifications">
        </div>
        <div class="profile">
            <img src="../assets/Profile Icon.png" alt="Profile Icon">
        </div>
    </div>
</header>

<div class="main-content">
    <!-- Feedback messages -->
    <?php if (!empty($message)): ?>
        <div class="alert alert-<?php echo htmlspecialchars($messageType); ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <!-- Transaction Summary Cards -->
    <div class="tabs-container">
        <div class="row">
            <div class="column">
                <div class="card">
                    <h3 class="card-header">Total Revenue</h3>
                    <p class="number">₱<?php echo number_format($stats['total_revenue'], 2); ?></p>
                </div>
            </div>
            <div class="column">
                <div class="card">
                    <h3 class="card-header">Total Transactions</h3>
                    <p class="number"><?php echo number_format($stats['total_transactions']); ?></p>
                </div>
            </div>
            <div class="column">
                <div class="card">
                    <h3 class="card-header">Pending Payments</h3>
                    <p class="number"><?php echo number_format($stats['pending_payments']); ?></p>
                </div>
            </div>
            <div class="column">
                <div class="card">
                    <h3 class="card-header">Refunded Payments</h3>
                    <p class="number"><?php echo number_format($stats['refunded_payments']); ?></p>
                </div>
            </div>
            <div class="column">
                <div class="card">
                    <h3 class="card-header">Total Commission</h3>
                    <p class="number">₱<?php echo number_format($stats['total_commission'], 2); ?></p>
                </div>
            </div>
        </div>
    </div>

    <!-- Chart Section -->
    <div class="stat-container">
        <div class="chart-wrapper">
            <div class="stat-grid">
                <div class="panel">
                    <div class="panel-header">
                        <h3 class="title">Monthly Transactions (<?php echo date('Y'); ?>)</h3>
                    </div>
                    <div class="panel-body">
                        <div class="y-axis" id="y-axis"></div>
                        <div class="chart">
                            <div class="legend" id="legend">
                                <div class="legend-item">
                                    <span></span>
                                    Total Revenue
                                </div>
                            </div>
                            <div class="chart-container">
                                <div class="grid-lines" id="grid-lines"></div>
                                <svg class="data-chart" id="line-svg"></svg>
                                <div class="data-points" id="data-points"></div>
                            </div>
                            <div class="month-indicators" id="month-indicators"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="tooltip" id="tooltip"></div>
</div>

<!-- Pass PHP data to JavaScript -->
<script>
    // Monthly transaction data from database
    const monthlyData = <?php echo $monthlyDataJson; ?>;
    
    // Dynamic Y-axis maximum value
    const yAxisMax = <?php echo $yAxisMax; ?>;
</script>
<script src="js/transaction.js"></script>
</body>
</html>