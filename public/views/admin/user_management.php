<?php
// Session & Authentication
// session_start();
require_once __DIR__ . '/../../../src/controllers/admin/UserController.php';

// INITIALIZE CONTROLLER
$controller = new UserController();

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->handleRequest();
    header('Location: user_management.php?' . http_build_query($_GET));
    exit;
}

// Get filter parameters from URL
$filters = [
    'search' => $_GET['search'] ?? '',
    'role' => $_GET['role'] ?? '',
    'status' => $_GET['status'] ?? '',
    'sort_by' => $_GET['sort_by'] ?? 'created_at',
    'sort_order' => $_GET['sort_order'] ?? 'DESC',
    'page' => isset($_GET['page']) ? (int)$_GET['page'] : 1
];

// Fetch users and statistics
$users = $controller->getUsers($filters);
$totalUsers = $controller->getTotalUsers($filters);
$stats = $controller->getUserStats();
$itemsPerPage = $controller->getItemsPerPage();
$totalPages = ceil($totalUsers / $itemsPerPage);
$currentPage = $filters['page'];

// Calculate pagination info
$pageStart = (($currentPage - 1) * $itemsPerPage) + 1;
$pageEnd = min($currentPage * $itemsPerPage, $totalUsers);

// Get messages
$message = $controller->getMessage();
$messageType = $controller->getMessageType();

// Prepare data for JavaScript
$usersJson = json_encode($users);
$filtersJson = json_encode($filters);
?>
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>User Management</title>
    <link rel="stylesheet" href="css/admin.css">
    <link rel="icon" type="image/x-icon" href="../assets/Logo.png">
</head>
<body>

    <div class="sidebar">
        <div class="logo-container">
            <img src="../assets/SAKAY BRAVO LOGO_DARK YELLOW.png" class="app-logo" alt="Logo">
        </div> 

        <a href="adminDashboard.php">Dashboard</a>
        <a class="active" href="user_management.php">User Management</a>
        <a href="vehicle_registration.php">Vehicle Registration</a>
        <a href="active_rides.php">Active Rides</a>
        <a href="transactions.php">Transactions</a>
        <a href="reports.php">Reports and Complaints</a>

        <div class="settings">
            <a href="system_settings.php" class="settings">Settings</a>
        </div>
    </div>

    <header class="top-nav">
        <div class="nav-left">
            <h1 class="nav-title">User Management</h1>
            <h2 class="sub-title">Monitor and manage users</h2>
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

    <!-- feedback messages (success, error, or warnings) -->
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
                        <h3 class="card-header">Total Users</h3>
                        <p class="number"><?php echo $stats['total_users']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Active Users</h3>
                        <p class="number"><?php echo $stats['active_users']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Inactive Users</h3>
                        <p class="number"><?php echo $stats['inactive_users']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Suspended</h3>
                        <p class="number"><?php echo $stats['suspended_users']; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Admin</h3>
                        <p class="number"><?php echo $stats['admin_users']; ?></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters Section -->
        <div class="filters">
            <div class="filter-left">
                <select class="filter-by-column" id="sortByFilter">
                    <option value="">Sort By</option>
                    <option value="created_at" <?php echo $filters['sort_by'] === 'created_at' ? 'selected' : ''; ?>>Date Created</option>
                    <option value="name" <?php echo $filters['sort_by'] === 'name' ? 'selected' : ''; ?>>Name</option>
                    <option value="role" <?php echo $filters['sort_by'] === 'role' ? 'selected' : ''; ?>>Role</option>
                    <option value="email" <?php echo $filters['sort_by'] === 'email' ? 'selected' : ''; ?>>Email</option>
                    <option value="status" <?php echo $filters['sort_by'] === 'status' ? 'selected' : ''; ?>>Status</option>
                    <option value="verified_by" <?php echo $filters['sort_by'] === 'verified_by' ? 'selected' : ''; ?>>Verified By</option>
                    <option value="verified_at" <?php echo $filters['sort_by'] === 'verified_at' ? 'selected' : ''; ?>>Verified At</option>
                    <option value="last_login" <?php echo $filters['sort_by'] === 'last_login' ? 'selected' : ''; ?>>Last Login</option>
                </select>
                  <select class="filter-by-roles" id="roleFilter">
                    <option value="">All Roles</option>
                    <option value="admin" <?php echo $filters['role'] === 'admin' ? 'selected' : ''; ?>>Admin</option>
                    <option value="driver" <?php echo $filters['role'] === 'driver' ? 'selected' : ''; ?>>Driver</option>
                    <option value="passenger" <?php echo $filters['role'] === 'passenger' ? 'selected' : ''; ?>>Passenger</option>
                </select>

                <button class="button sort-order-button" id="sortOrderBtn" 
                        data-order="<?php echo $filters['sort_order']; ?>">
                    <span class="sort-icon"><?php echo $filters['sort_order'] === 'ASC' ? '↑' : '↓'; ?></span>
                    <span class="sort-text"><?php echo $filters['sort_order'] === 'ASC' ? 'Ascending' : 'Descending'; ?></span>
                </button>
            </div>

            <div class="filter-right">
                 <button class="button add-button" id="openFormBtn">Add <span>+</span></button>

                <button class="button export-button" id="exportBtn">Export CSV</button>

                <input type="text" class="filter-search-bar" placeholder="Search by name, email, userID..." 
                       value="<?php echo htmlspecialchars($filters['search']); ?>" id="searchInput"/>
            </div>
        </div>

        <!-- Users Table -->
        <div class="table-of-information">
            <table class="users-information">
                <thead>
                    <tr>
                        <th>Profile</th>
                        <th>User ID</th>
                        <th>Users</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Verified by</th>
                        <th>Date Verified</th>
                        <th>Verified at</th>
                        <th>Last logged in</th>
                        <th>Action</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <?php foreach ($users as $user): 
                        $profilePic = !empty($user['profile_pic']) ? htmlspecialchars($user['profile_pic']) : '../assets/default-profile.png';
                        $fullName = htmlspecialchars($user['first_name'] . ' ' . $user['last_name']);
                        $verifiedAt = $user['verified_at'] ? date('h:i A', strtotime($user['verified_at'])) : '-';
                        $createdDate = date('d/m', strtotime($user['created_at']));
                        $lastLogin = $user['last_login'] ? date('m/d/y', strtotime($user['last_login'])) : '-';
                    ?>
                    <tr data-user-id="<?php echo htmlspecialchars($user['userID']); ?>">
                        <td><img src="<?php echo $profilePic; ?>" alt="Profile" class="profile-thumbnail"></td>
                        <td><?php echo htmlspecialchars($user['userID']); ?></td>
                        <td><?php echo $fullName; ?></td>
                        <td><?php echo htmlspecialchars(ucfirst($user['role'])); ?></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td>
                            <select class="status-dropdown <?php echo $user['status']; ?>" 
                                    data-user-id="<?php echo htmlspecialchars($user['userID']); ?>"
                                    data-original-status="<?php echo $user['status']; ?>">
                                <option value="default">Status</option>
                                <option value="active" <?php echo $user['status'] === 'active' ? 'selected' : ''; ?>>Active</option>
                                <option value="suspended" <?php echo $user['status'] === 'suspended' ? 'selected' : ''; ?>>Suspended</option>
                                <option value="pending_verification" <?php echo $user['status'] === 'pending_verification' ? 'selected' : ''; ?>>Pending</option>
                                <option value="deactivated" <?php echo $user['status'] === 'deactivated' ? 'selected' : ''; ?>>Deactivated</option>
                            </select>
                        </td>
                        <td><?php echo htmlspecialchars($user['verified_by'] ?? '-'); ?></td>
                        <td><?php echo $createdDate; ?></td>
                        <td><?php echo $verifiedAt; ?></td>
                        <td><?php echo $lastLogin; ?></td>
                        <td>
                            <div class="action-buttons">
                                <button class="button edit-button" 
                                        data-user='<?php echo htmlspecialchars(json_encode($user)); ?>'>
                                    Edit
                                </button>
                                <button class="button delete-button" 
                                        data-user-id="<?php echo htmlspecialchars($user['userID']); ?>"
                                        data-user-name="<?php echo $fullName; ?>">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
            <div class="pagination-info">
                Showing <strong><?php echo $pageStart; ?></strong> to 
                <strong><?php echo $pageEnd; ?></strong> of 
                <strong><?php echo $totalUsers; ?></strong> users
            </div>
            <div class="pagination-buttons" id="paginationButtons">
                <!-- Generated by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Add User Popup -->
    <div class="popup-form" id="popupForm">
        <div class="form-content">
            <span class="close-btn" id="closeFormBtn">&times;</span>
            <h1 class="heading">Add a New Record</h1>
            <form method="POST" action="user_management.php" id="addForm" novalidate>
            <input type="hidden" name="action" value="add">

            <label for="add_fname">First Name</label>
            <input type="text" id="add_fname" name="first_name" placeholder="Enter first name...">
            <span class="error-msg" id="error_add_fname"></span>

            <label for="add_lname">Last Name</label>
            <input type="text" id="add_lname" name="last_name" placeholder="Enter last name...">
            <span class="error-msg" id="error_add_lname"></span>

            <label for="add_email">Email</label>
            <input type="text" id="add_email" name="email" placeholder="Enter email...">
            <span class="error-msg" id="error_add_email"></span>

            <label for="add_roles">Select a Role</label>
            <select id="add_roles" name="role">
                <option value="">Role</option>
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
                <option value="passenger">Passenger</option>
            </select>
            <span class="error-msg" id="error_add_role"></span>

            <input type="submit" value="Submit">
            </form>
        </div>
    </div>

    <!-- Edit User Popup -->
    <div class="popup-form" id="editPopup">
        <div class="form-content">
            <span class="close-btn" id="closeEditBtn">&times;</span>
            <h1 class="heading">Edit a Record</h1>
            <form method="POST" action="user_management.php" id="editForm" novalidate>
            <input type="hidden" name="action" value="edit">
            <input type="hidden" name="userID" id="edit_userID">

            <label for="edit_fname">First Name</label>
            <input type="text" id="edit_fname" name="first_name">
            <span class="error-msg" id="error_edit_fname"></span>

            <label for="edit_lname">Last Name</label>
            <input type="text" id="edit_lname" name="last_name">
            <span class="error-msg" id="error_edit_lname"></span>

            <label for="edit_email">Email</label>
            <input type="text" id="edit_email" name="email">
            <span class="error-msg" id="error_edit_email"></span>

            <label for="edit_roles">Select a Role</label>
            <select id="edit_roles" name="role">
                <option value="">Role</option>
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
                <option value="passenger">Passenger</option>
            </select>
            <span class="error-msg" id="error_edit_role"></span>

            <input type="submit" value="Update">
            </form>
        </div>
    </div>

    <!-- Delete User Popup -->
    <div class="popup-form" id="deletePopup">
        <div class="form-content delete-content">
            <span class="close-btn" id="closeDeleteBtn">&times;</span>
            <h2>Delete Record</h2>
            <p>Are you sure you want to delete <strong id="deleteUserName"></strong>?</p>
            <form method="POST" action="user_management.php" id="deleteForm">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="userID" id="delete_userID">
                <div class="delete-actions">
                    <button type="button" class="cancel-btn" id="cancelDeleteBtn">Cancel</button>
                    <button type="submit" class="delete-btn">Delete</button>
                </div>
            </form>
        </div>
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

    <!-- Notification Popup -->
    <div id="notificationPopup" class="notification-popup">
        <span id="notificationMessage"></span>
    </div>

    <!-- Pass data to JavaScript -->
    <script>
        window.pageData = {
            totalPages: <?php echo $totalPages; ?>,
            currentPage: <?php echo $currentPage; ?>,
            filters: <?php echo $filtersJson; ?>
        };
    </script>
    <script src="js/user_management.js"></script>
    <script src="js/form_validation.js"></script>
    <script src="js/notif.js"></script>
</body>
</html>