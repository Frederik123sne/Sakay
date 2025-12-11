<?php
session_start();
require_once __DIR__ . '../../../../src/controllers/admin/UserController.php';

// Initialize Controller
$controller = new UserController();

// Handle POST requests (Add, Edit, Delete)
$controller->handleRequest();

// Get filters from URL
$search = $_GET['search'] ?? '';
$role = $_GET['role'] ?? '';
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = 7;

// Fetch data from controller
$stats = $controller->getUserStats();
$allUsers = $controller->getUsers($search, $role);
$totalUsers = count($allUsers);
$totalPages = ceil($totalUsers / $perPage);
$offset = ($page - 1) * $perPage;
$users = array_slice($allUsers, $offset, $perPage);

// Get selected user
$selectedUserID = $controller->getSelectedUserID();
$selectedUser = $selectedUserID ? $controller->getUserDetails($selectedUserID) : null;

// Get messages
$message = $controller->getMessage();
$messageType = $controller->getMessageType();

// Helper function for date formatting
function formatDate($dateStr, $type = 'full')
{
    if (!$dateStr) return '-';
    $timestamp = strtotime($dateStr);
    if (!$timestamp) return '-';

    switch ($type) {
        case 'short':
            return date('n/j/Y', $timestamp);
        case 'time':
            return date('g:i A', $timestamp);
        case 'date':
            return date('Y-m-d', $timestamp);
        default:
            return date('m/d/Y g:i A', $timestamp);
    }
}

// Helper function for building query strings
function buildQueryString($params)
{
    $current = $_GET;
    foreach ($params as $key => $value) {
        if ($value === null) {
            unset($current[$key]);
        } else {
            $current[$key] = $value;
        }
    }
    return http_build_query($current);
}
?>
<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>User Management</title>
    <link rel="stylesheet" href="css/admin.css">
    <link rel="icon" type="image/x-icon" href="../assets/Logo.png">
    <style>

    </style>
</head>

<body>
    <div class="sidebar">
        <div class="logo-container">
            <img src="../assets/SAKAY BRAVO LOGO_DARK YELLOW.png" class="app-logo" alt="Logo">
        </div>
        <a href="adminDashboard.php">Dashboard</a>
        <a class="active" href="users.php">User Management</a>
        <a href="vehicle_registration.php">Vehicle Registration</a>
        <a href="active_rides.php">Active Rides</a>
        <a href="transactions.php">Transactions</a>
        <a href="reports.php">Reports and Complaints</a>
        <div class="settings">
            <a href="system_settings.php" class="settings">Settings</a>
        </div>
    </div>

    <header class="top-nav">
        <div class="hamburger" id="hamburger">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>  
        </div>

        <div class="nav-left">
            <h1 class="nav-title">User Management</h1>
            <h2 class="sub-title">Monitor and manage users</h2>
        </div>

        <div class="nav-center">
            <input type="text" placeholder="Search..." class="search-bar">
        </div>

        <div class="nav-right">
            <div class="icon notification">
                <img src="../assets/Notification Icon.png">
            </div>

            <div class="profile">
                <img src="../assets/Profile Icon.png"> <!-- For testing only -->
            </div>
        </div>
    </header>

    <div class="overlay" id="overlay"></div>


    <div class="main-content">
        <?php if ($message): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <!-- Statistics Cards -->
        <div class="tabs-container">
            <div class="row">
                <div class="column">
                    <div class="card">
                        <h3>Total Users</h3>
                        <p class="number"><?php echo $stats['total_users'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3>Active Users</h3>
                        <p class="number"><?php echo $stats['active_users'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3>Inactive Users</h3>
                        <p class="number"><?php echo $stats['inactive_users'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3>Suspended</h3>
                        <p class="number"><?php echo $stats['suspended_users'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3>Admin</h3>
                        <p class="number"><?php echo $stats['admin_users'] ?? 0; ?></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter Bar -->
        <form method="GET" action="users.php" class="filters" id="filterForm">
            <div class="filter-left">
                <input type="text" name="search" class="filter-search-bar"
                    placeholder="Search by name..."
                    value="<?php echo htmlspecialchars($search); ?>">
                <button type="button" class="button add-button" onclick="openModal('addModal')">
                    Add <span>+</span>
                </button>
                <button type="button" class="button delete-button" onclick="confirmDelete()">
                    Delete
                </button>
                <button type="button" class="button edit-button" onclick="openEditModal()">
                    Edit
                </button>
            </div>
            <div class="filter-right">
                <select name="role" class="filter-by-roles" onchange="this.form.submit()">
                    <option value="">All Roles</option>
                    <option value="admin" <?php echo $role === 'admin' ? 'selected' : ''; ?>>Admin</option>
                    <option value="driver" <?php echo $role === 'driver' ? 'selected' : ''; ?>>Driver</option>
                    <option value="passenger" <?php echo $role === 'passenger' ? 'selected' : ''; ?>>Passenger</option>
                </select>
                <button type="button" class="button export-button" onclick="document.getElementById('exportForm').submit()">
                    Export CSV
                </button>
            </div>
        </form>

        <!-- Users Table -->
        <div class="table-of-information">
            <table class="users-information">
                <thead>
                    <tr>
                        <th>Date Created</th>
                        <th>Users</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Verified by</th>
                        <th>Verified at</th>
                        <th>Last logged in</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($users)): ?>
                        <tr>
                            <td colspan="8" style="text-align:center; padding:30px; color:#888;">
                                No users found
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($users as $user): ?>
                            <tr data-id="<?php echo $user['userID']; ?>" style="cursor: pointer;">
                                <td><?php echo formatDate($user['created_at'], 'date'); ?></td>
                                <td><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></td>
                                <td><?php echo ucfirst($user['role']); ?></td>
                                <td><?php echo htmlspecialchars($user['email']); ?></td>
                                <td><?php echo ucfirst($user['status']); ?></td>
                                <td><?php echo htmlspecialchars($user['verified_by'] ?? '-'); ?></td>
                                <td><?php echo formatDate($user['verified_at'], 'time'); ?></td>
                                <td><?php echo formatDate($user['last_login'], 'short'); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
            <div class="pagination-info">
                <?php if ($totalUsers > 0): ?>
                    Showing <strong><?php echo $offset + 1; ?></strong> to
                    <strong><?php echo min($offset + $perPage, $totalUsers); ?></strong> of
                    <strong><?php echo $totalUsers; ?></strong> users
                <?php endif; ?>
            </div>
            <div class="pagination-buttons">
                <?php if ($totalPages > 1): ?>
                    <button class="page-btn" <?php echo $page <= 1 ? 'disabled' : ''; ?>
                        onclick="location.href='?<?php echo buildQueryString(['page' => $page - 1]); ?>'">
                        &#8249;
                    </button>

                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                        <?php if ($i == 1 || $i == $totalPages || abs($i - $page) <= 1): ?>
                            <button class="page-btn <?php echo $i == $page ? 'active' : ''; ?>"
                                onclick="location.href='?<?php echo buildQueryString(['page' => $i]); ?>'">
                                <?php echo $i; ?>
                            </button>
                        <?php elseif ($i == 2 && $page > 3): ?>
                            <span class="page-dots">...</span>
                        <?php elseif ($i == $totalPages - 1 && $page < $totalPages - 2): ?>
                            <span class="page-dots">...</span>
                        <?php endif; ?>
                    <?php endfor; ?>

                    <button class="page-btn" <?php echo $page >= $totalPages ? 'disabled' : ''; ?>
                        onclick="location.href='?<?php echo buildQueryString(['page' => $page + 1]); ?>'">
                        &#8250;
                    </button>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <script src="js/user_management.js"></script>
</body>

</html>