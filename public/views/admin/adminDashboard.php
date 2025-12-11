<?php
require_once __DIR__ . '/../../../src/core/Session.php';
require_once __DIR__ . '/../../../src/controllers/admin/UserController.php';
require_once __DIR__ . '/../../../src/controllers/admin/VehicleController.php';
$userController = new UserController();
$vehicleController = new VehicleController();
?>

<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="../admin/css/admin.css">
    <link rel="icon" type="image/x-icon" href="../assets/Logo.png">
</head>

<body>

    <div class="sidebar">
        <div class="logo-container">
            <img src="../assets/SAKAY BRAVO LOGO_DARK YELLOW.png" class="app-logo" alt="Logo">
        </div>

        <a class="active" href="adminDashboard.php">Dashboard</a>
        <a href="users.php">User Management</a>
        <a href="vehicle_registration.php">Vehicle Registration</a>
        <a href="active_rides.php">Active Rides</a>
        <a href="transactions.php">Transactions</a>
        <a href="reports.php">Reports & Complaints</a>

        <div class="settings">
            <a href="system_settings.php">Settings</a>
        </div>
    </div>


    <header class="top-nav">
        <div class="nav-left">
            <h1 class="nav-title">Dashboard Overview</h1>
            <h2 class="sub-title">Monitor and manage activities</h2>
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
        <div class="tabs-container">
            <!-- Stats will be loaded by DOM API-->
            <div class="row">
                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Total Users</h3>
                        <p id="totalUsersCount" class="number">150</p>
                    </div>
                </div>

                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Active Users</h3>
                        <p id="activeUsersCount" class="number">125</p>
                    </div>
                </div>

                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Inactive Users</h3>
                        <p id="inactiveUsersCount" class="number">15</p>
                    </div>
                </div>

                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Suspended</h3>
                        <p id="suspendedUsersCount" class="number">5</p>
                    </div>
                </div>

                <div class="column">
                    <div class="card">
                        <h3 class="card-header">Admin</h3>
                        <p id="adminUsersCount" class="number">5</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Ride Activity -->
            <div class="panel ride-activity">
                <div class="panel-header">
                    <h3>Ride Activity</h3>
                </div>
                <!-- Data will be loaded by DOM API-->
                <canvas id="rideActivityChart"></canvas>
            </div>

            <!-- User Growth -->
            <div class="panel user-growth">
                <div class="panel-header">
                    <h3>User Growth</h3>
                    <div class="panel-controls" style="display:flex;gap:8px;align-items:center;">
                        <span class="growth-months-label">Months:</span>
                        <select id="growthMonthsSelect" class="growth-months-select">
                            <option value="3">3</option>
                            <option value="6" selected>6</option>
                            <option value="12">12</option>
                        </select>
                        <label style="font-size:12px;color:#555;display:flex;align-items:center;gap:6px;margin-left:8px;">
                            <input type="checkbox" id="growthShowYear"> Show year
                        </label>
                        <div id="userGrowthYear" class="user-growth-year"></div>
                    </div>
                </div>
                <!-- Data will be loaded by DOM API-->
                <canvas id="userGrowthChart"></canvas>
            </div>

            <!-- Pending Vehicle Approvals -->
            <div class="panel">
                <h3>Pending Vehicle Approvals</h3>
                <div id="vehicleTable">
                    <table>
                        <thead>
                            <tr>
                                <th>Owner</th>
                                <th>Vehicle</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr id="vehicle-loading-row">
                                <td colspan="4" class="vehicle-loading-row">Loading pending vehicles...</td>
                                <!-- Vehicle details will be loaded by DOM API-->
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Recent Reports -->
            <div class="panel recent-reports">
                <div class="panel-header">
                    <h3>Recent Reports</h3>
                    <a href="reports.php" class="view-all">View All</a>
                </div>
                <ul class="reports-list" id="recentReportsList">
                    <!-- Recent reports will be loaded by DOM API-->
                </ul>
            </div>

        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/admin.js"></script>
</body>

</html>