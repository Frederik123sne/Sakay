<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../../src/controllers/admin/ReportController.php';


// Initialize controller
$controller = new ReportController();

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->handleRequest();
    header('Location: reports.php?' . http_build_query($_GET));
    exit;
}

// Get filter parameters
$filters = [
    'search' => $_GET['search'] ?? '',
    'status' => $_GET['status'] ?? '',
    'sort_by' => $_GET['sort_by'] ?? 'created_at',
    'sort_order' => $_GET['sort_order'] ?? 'DESC',
    'page' => isset($_GET['page']) ? (int)$_GET['page'] : 1
];

// Fetch reports and stats
$reports = $controller->getReports($filters);
$totalReports = $controller->getTotalReports($filters);
$stats = $controller->getReportStats();
$itemsPerPage = $controller->getItemsPerPage();
$totalPages = ceil($totalReports / $itemsPerPage);
$currentPage = $filters['page'];

$pageStart = (($currentPage - 1) * $itemsPerPage) + 1;
$pageEnd = min($currentPage * $itemsPerPage, $totalReports);

$message = $controller->getMessage();
$messageType = $controller->getMessageType();

$reportsJson = json_encode($reports);
$filtersJson = json_encode($filters);
?>
<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reports and Complaints</title>
    <link rel="stylesheet" href="css/admin.css">
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
        <a href="transactions.php">Transactions</a>
        <a class="active" href="reports.php">Reports and Complaints</a>
        <div class="settings">
            <a href="system_settings.php">Settings</a>
        </div>
    </div>

    <header class="top-nav">
        <div class="nav-left">
            <h1 class="nav-title">Reports and Complaints</h1>
            <h2 class="sub-title">Monitor and manage submitted reports</h2>
        </div>
        <div class="nav-right">
            <div class="icon notification">
                <img src="../assets/Notification Icon.png">
            </div>
            <div class="profile">
                <img src="../assets/Profile Icon.png">
            </div>
        </div>
    </header>

    <div class="main-content">
        <?php if ($message): ?>
            <div class="alert alert-<?php echo htmlspecialchars($messageType); ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <!-- Statistics Cards -->
        <div class="tabs-container">
            <div class="row">
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Total Reports</h3>
                        <p class="number"><?php echo $stats['total_reports']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Pending</h3>
                        <p class="number"><?php echo $stats['pending_reports']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Reviewed</h3>
                        <p class="number"><?php echo $stats['reviewed_reports']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Resolved</h3>
                        <p class="number"><?php echo $stats['resolved_reports']; ?></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-left">
                <select class="filter-by-column" id="sortByFilter">
                    <option value="">Sort By</option>
                    <option value="created_at" <?php echo $filters['sort_by'] === 'created_at' ? 'selected' : ''; ?>>Date Created</option>
                    <option value="report_type" <?php echo $filters['sort_by'] === 'report_type' ? 'selected' : ''; ?>>Report Type</option>
                    <option value="status" <?php echo $filters['sort_by'] === 'status' ? 'selected' : ''; ?>>Status</option>
                </select>

                <button class="button sort-order-button" id="sortOrderBtn"
                    data-order="<?php echo $filters['sort_order']; ?>">
                    <span class="sort-icon"><?php echo $filters['sort_order'] === 'ASC' ? '↑' : '↓'; ?></span>
                    <span class="sort-text"><?php echo $filters['sort_order'] === 'ASC' ? 'Ascending' : 'Descending'; ?></span>
                </button>
            </div>

            <div class="filter-right">
                <button class="button export-button" id="exportBtn">Export CSV</button>
                <input type="text" class="filter-search-bar" placeholder="Search by reporter, type, or subject..."
                    value="<?php echo htmlspecialchars($filters['search']); ?>" id="searchInput" />
            </div>
        </div>

        <!-- Reports Table -->
        <div class="table-of-information">
            <table class="users-information">
                <thead>
                    <tr>
                        <th>Reporter</th>
                        <th>Reported User</th>
                        <th>Ride ID</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Resolved At</th>
                    </tr>
                </thead>
                <tbody id="reportsTableBody">
                    <?php foreach ($reports as $report): ?>
                        <?php
                        // Reporter profile photo
                        $reporterPhoto = !empty($report['reporter_profile_pic'])
                            ? htmlspecialchars($report['reporter_profile_pic'])
                            : '../assets/default-profile.png';

                        // Reporter full name or fallback to userID
                        $reporterName = !empty($report['reporter_first_name'] || $report['reporter_last_name'])
                            ? htmlspecialchars($report['reporter_first_name'] . ' ' . $report['reporter_last_name'])
                            : htmlspecialchars($report['reporter_userID'] ?? '-');
                        ?>
                        <tr data-report-id="<?php echo htmlspecialchars($report['reportID']); ?>">
                            <!-- Reporter with profile photo -->
                            <td class="user-cell">
                                <img src="<?php echo $reporterPhoto; ?>" alt="Reporter Photo" class="user-avatar">
                                <span><?php echo $reporterName; ?></span>
                            </td>

                            <!-- Reported user just text -->
                            <td>
                                <?php echo htmlspecialchars($report['reported_userID'] ?? '-'); ?>
                            </td>

                            <td><?php echo htmlspecialchars($report['rideID'] ?? '-'); ?></td>
                            <td><?php echo htmlspecialchars(ucwords(str_replace('_', ' ', $report['report_type']))); ?></td>
                            <td><?php echo htmlspecialchars($report['subject']); ?></td>
                            <td><?php echo htmlspecialchars($report['description']); ?></td>
                            <td>
                                <select class="status-dropdown <?php echo htmlspecialchars($report['status']); ?>"
                                    data-report-id="<?php echo htmlspecialchars($report['reportID']); ?>"
                                    data-original-status="<?php echo htmlspecialchars($report['status']); ?>">
                                    <option value="pending" <?php echo $report['status'] === 'pending' ? 'selected' : ''; ?>>Pending</option>
                                    <option value="reviewed" <?php echo $report['status'] === 'reviewed' ? 'selected' : ''; ?>>Reviewed</option>
                                    <option value="resolved" <?php echo $report['status'] === 'resolved' ? 'selected' : ''; ?>>Resolved</option>
                                </select>
                            </td>
                            <td><?php echo date('Y-m-d', strtotime($report['created_at'])); ?></td>
                            <td><?php echo $report['resolved_at'] ? date('Y-m-d', strtotime($report['resolved_at'])) : '-'; ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

         <!-- Status Change Popup -->
        <div class="popup-form" id="statusPopup">
            <div class="form-content delete-content">
                <span class="close-btn" id="closeStatusBtn">&times;</span>

                <h2>Confirm Status Change</h2>
                <p>
                    Change status of <strong id="statusUserName"></strong>  
                    to <strong id="statusNewValue"></strong>?
                </p>

                <div class="delete-actions">
                    <button type="button" class="cancel-btn" id="cancelStatusBtn">Cancel</button>
                    <button type="button" class="delete-btn" id="confirmStatusBtn">Confirm</button>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
            <div class="pagination-info">
                Showing <strong><?php echo $pageStart; ?></strong> to
                <strong><?php echo $pageEnd; ?></strong> of
                <strong><?php echo $totalReports; ?></strong> reports
            </div>
            <div class="pagination-buttons" id="paginationButtons"></div>
        </div>
    </div>

    <script>
        window.pageData = {
            totalPages: <?php echo $totalPages; ?>,
            currentPage: <?php echo $currentPage; ?>,
            filters: <?php echo $filtersJson; ?>
        };
    </script>

    <script src="js/admin_reports.js"></script>
</body>
</html>