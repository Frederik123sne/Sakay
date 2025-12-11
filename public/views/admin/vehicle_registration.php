<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../../../src/controllers/admin/VehicleController.php';

$controller = new VehicleController();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->handleRequest();
    header('Location: vehicle_registration.php?' . http_build_query($_GET));
    exit;
}

$filters = [
    'search' => $_GET['search'] ?? '',
    'status' => $_GET['status'] ?? '',
    'sort_by' => $_GET['sort_by'] ?? 'created_at',
    'sort_order' => $_GET['sort_order'] ?? 'DESC',
    'page' => isset($_GET['page']) ? (int)$_GET['page'] : 1
];

$vehicles = $controller->getVehicles($filters);
$totalVehicles = $controller->getTotalVehicles($filters);
$stats = $controller->getVehicleStats();
$itemsPerPage = $controller->getItemsPerPage();
$totalPages = ceil($totalVehicles / $itemsPerPage);
$currentPage = $filters['page'];

$pageStart = (($currentPage - 1) * $itemsPerPage) + 1;
$pageEnd = min($currentPage * $itemsPerPage, $totalVehicles);

$message = $controller->getMessage();
$messageType = $controller->getMessageType();

$filtersJson = json_encode($filters);
?>
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Vehicle Registration</title>
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
        <a class="active" href="vehicle_registration.php">Vehicle Registration</a>
        <a href="active_rides.php">Active Rides</a>
        <a href="transactions.php">Transactions</a>
        <a href="reports.php">Reports and Complaints</a>
        <div class="settings">
            <a href="system_settings.php" class="settings">Settings</a>
        </div>
    </div>

    <header class="top-nav">
        <div class="nav-left">
            <h1 class="nav-title">Vehicle Registration</h1>
            <h2 class="sub-title">Monitor and manage vehicle registrations</h2>
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

        <!-- Stats Cards -->
        <div class="tabs-container">
            <div class="row">
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Total Vehicles</h3>
                        <p class="number"><?php echo $stats['total'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Active</h3>
                        <p class="number"><?php echo $stats['active'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">For Renewal</h3>
                        <p class="number"><?php echo $stats['for_renewal'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Expired</h3>
                        <p class="number"><?php echo $stats['expired'] ?? 0; ?></p>
                    </div>
                </div>
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Cancelled / Rejected</h3>
                        <p class="number"><?php echo ($stats['cancelled'] ?? 0) + ($stats['rejected'] ?? 0); ?></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-left">
                <select class="filter-by-column" id="sortByFilter">
                    <option value="created_at" <?php echo $filters['sort_by'] === 'created_at' ? 'selected' : ''; ?>>Date Created</option>
                    <option value="brand" <?php echo $filters['sort_by'] === 'brand' ? 'selected' : ''; ?>>Brand</option>
                    <option value="plate_number" <?php echo $filters['sort_by'] === 'plate_number' ? 'selected' : ''; ?>>Plate Number</option>
                    <option value="vehicle_status" <?php echo $filters['sort_by'] === 'vehicle_status' ? 'selected' : ''; ?>>Status</option>
                </select>

                <button class="button sort-order-button" id="sortOrderBtn" data-order="<?php echo $filters['sort_order']; ?>">
                    <span class="sort-icon"><?php echo $filters['sort_order'] === 'ASC' ? '↑' : '↓'; ?></span>
                    <span class="sort-text"><?php echo $filters['sort_order'] === 'ASC' ? 'Ascending' : 'Descending'; ?></span>
                </button>
            </div>

            <div class="filter-right">
                <button class="button add-button" id="addVehicleBtn">Add <span>+</span></button>
                <button class="button export-button" id="exportBtn">Export CSV</button>
                <input type="text" class="filter-search-bar" placeholder="Search by driver, plate, or brand..." 
                       value="<?php echo htmlspecialchars($filters['search']); ?>" id="searchInput"/>
            </div>
        </div>

    <!-- Vehicles Table -->
    <div class="table-of-information">
        <table class="users-information">
            <thead>
                <tr>
                    <th>Driver</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Vehicle Brand</th>
                    <th>Model</th>
                    <th>Plate Number</th>
                    <th>Date Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($vehicles as $vehicle): 
                    $driverPic = !empty($vehicle['profile_pic']) ? htmlspecialchars($vehicle['profile_pic']) : '../assets/default-profile.png';
                    $driverName = htmlspecialchars($vehicle['driver_full_name'] ?? 'Unknown');
                    $driverEmail = htmlspecialchars($vehicle['driver_email'] ?? 'N/A');
                    $createdDate = !empty($vehicle['created_at']) ? date('m/d/Y', strtotime($vehicle['created_at'])) : '';
                ?>
                <tr data-vehicle-id="<?php echo htmlspecialchars($vehicle['vehicleID']); ?>">
                    <td>
                        <img src="<?php echo $driverPic; ?>" alt="Driver" class="profile-thumbnail">
                        <?php echo $driverName; ?>
                    </td>
                    <td><?php echo $driverEmail; ?></td>
                    <td>
                        <select class="status-dropdown <?php echo htmlspecialchars($vehicle['vehicle_status']); ?>"
                                data-vehicle-id="<?php echo htmlspecialchars($vehicle['vehicleID']); ?>"
                                data-original-status="<?php echo htmlspecialchars($vehicle['vehicle_status']); ?>">
                            <option value="active" <?php echo $vehicle['vehicle_status'] === 'active' ? 'selected' : ''; ?>>Active</option>
                            <option value="for_renewal" <?php echo $vehicle['vehicle_status'] === 'for_renewal' ? 'selected' : ''; ?>>For Renewal</option>
                            <option value="renewed" <?php echo $vehicle['vehicle_status'] === 'renewed' ? 'selected' : ''; ?>>Renewed</option>
                            <option value="expired" <?php echo $vehicle['vehicle_status'] === 'expired' ? 'selected' : ''; ?>>Expired</option>
                            <option value="cancelled" <?php echo $vehicle['vehicle_status'] === 'cancelled' ? 'selected' : ''; ?>>Cancelled</option>
                            <option value="rejected" <?php echo $vehicle['vehicle_status'] === 'rejected' ? 'selected' : ''; ?>>Rejected</option>
                        </select>
                    </td>
                    <td><?php echo htmlspecialchars($vehicle['brand']); ?></td>
                    <td><?php echo htmlspecialchars($vehicle['model']); ?></td>
                    <td><?php echo htmlspecialchars($vehicle['plate_number']); ?></td>
                    <td><?php echo $createdDate; ?></td>
                    <td>
                        <div class="action-buttons">
                            <button class="button view-button" 
                                    data-vehicle='<?php echo htmlspecialchars(json_encode($vehicle)); ?>'>
                                View Details
                            </button>
                            <button class="button edit-button" 
                                    data-vehicle='<?php echo htmlspecialchars(json_encode($vehicle)); ?>'>
                                Edit
                            </button>
                            <button class="button delete-button" 
                                    data-vehicle-id="<?php echo htmlspecialchars($vehicle['vehicleID']); ?>"
                                    data-driver-name="<?php echo $driverName; ?>">
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
                <strong><?php echo $totalVehicles; ?></strong> vehicles
            </div>
            <div class="pagination-buttons" id="paginationButtons"></div>
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

    <!-- View Vehicle Registration Popup -->
    <div class="popup-form" id="viewRegistrationPopup">
        <div class="form-content view-cards">
            <span class="close-btn" id="closeViewBtn">&times;</span>
            <h1 class="heading">Vehicle Registration Details</h1>
            
            <div class="cards-container">
                <!-- Vehicle Card -->
                <div class="cards vehicle">
                    <section class="landscape-section">
                        <div class="sky"></div>
                        <div class="sun"></div>
                        <div class="ocean">
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                        </div>
                        <div class="hill-1"></div>
                        <div class="ocean">
                            <div class="shadow-hill-1"></div>
                        </div>
                        <div class="hill-2"></div>
                        <div class="ocean">
                            <div class="shadow-hill-2"></div>
                        </div>
                        <div class="hill-3"></div>
                        <div class="hill-4"></div>
                        <div class="filter"></div>
                    </section>

                    <section class="content-section">
                        <div class="info-header">
                            <div class="left-side">
                                <div class="icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 17H3C2.44772 17 2 16.5523 2 16V12.2C2 11.0799 2 10.5198 2.16275 10.054C2.3073 9.63803 2.54668 9.25989 2.86228 8.94982C3.21798 8.59951 3.70024 8.37737 4.66476 7.93309L6.5 7.05539C8.09035 6.34388 8.88552 5.98812 9.55259 5.87973C10.4473 5.73779 11.3608 5.8527 12.1878 6.21127C12.8014 6.48566 13.3323 7.00821 14.3941 8.05331L18 11.5M7 17H17M7 17C7 18.6569 5.65685 20 4 20C2.34315 20 1 18.6569 1 17C1 15.3431 2.34315 14 4 14C5.65685 14 7 15.3431 7 17ZM17 17C17 18.6569 18.3431 20 20 20C21.6569 20 23 18.6569 23 17C23 15.3431 21.6569 14 20 14C18.3431 14 17 15.3431 17 17Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <p>Vehicle</p>
                            </div>
                            <div class="right-side">
                                <p>Status</p>
                                <p class="title" id="viewVehicleStatus">Active</p>
                                <p class="main-value" id="viewBrand">Toyota</p>
                            </div>
                        </div>
                        <div class="details">
                            <div>
                                <p>Model</p>
                                <p><strong id="viewModel">Camry</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>Plate No.</p>
                                <p><strong id="viewPlateNumber">ABC 1234</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>Color</p>
                                <p><strong id="viewColor">Silver</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>Year</p>
                                <p><strong id="viewYear">2022</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>Seats</p>
                                <p><strong id="viewSeats">5</strong></p>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Driver Card -->
                <div class="cards driver">
                    <section class="landscape-section">
                        <div class="sky"></div>
                        <div class="sun"></div>
                        <div class="ocean">
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                            <div class="reflection"></div>
                        </div>
                        <div class="hill-1"></div>
                        <div class="ocean">
                            <div class="shadow-hill-1"></div>
                        </div>
                        <div class="hill-2"></div>
                        <div class="ocean">
                            <div class="shadow-hill-2"></div>
                        </div>
                        <div class="hill-3"></div>
                        <div class="hill-4"></div>
                        <div class="filter"></div>
                        
                        <!-- Image Placeholder -->
                        <div class="image-placeholder" id="driverImagePlaceholder">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="6" r="4" stroke="#ffffff" stroke-width="1.5"/>
                                <path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="#ffffff" stroke-width="1.5"/>
                            </svg>
                        </div>
                    </section>

                    <section class="content-section">
                        <div class="info-header">
                            <div class="left-side">
                                <div class="icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="6" r="4" stroke="#ffffff" stroke-width="1.5"/>
                                        <path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="#ffffff" stroke-width="1.5"/>
                                    </svg>
                                </div>
                                <p>Driver</p>
                            </div>
                            <div class="right-side">
                                <p>Email</p>
                                <p class="title" id="viewDriverEmail" style="font-size: 8pt;">john@email.com</p>
                                <p class="main-value" id="viewDriverName">John Doe</p>
                            </div>
                        </div>
                        <div class="details">
                            <div>
                                <p>License No.</p>
                                <p><strong id="viewLicenseNumber">DL-123456</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>License Expiry</p>
                                <p><strong id="viewLicenseExpiry">12/31/2025</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>License Type</p>
                                <p><strong id="viewLicenseType">Professional</strong></p>
                            </div>
                            <div class="separator"></div>
                            <div>
                                <p>License Status</p>
                                <p><strong id="viewLicenseStatus">Active</strong></p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>

    <script>
        window.pageData = {
            totalPages: <?php echo $totalPages; ?>,
            currentPage: <?php echo $currentPage; ?>,
            filters: <?php echo $filtersJson; ?>
        };
    </script>

    <script src="js/vehicle.js"></script>
    <script src="js/form_validation.js"></script>
</body>
</html>
