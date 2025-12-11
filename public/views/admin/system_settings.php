<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>System Settings</title>
        <link rel="stylesheet" href="../admin/css/admin.css">
        <link rel="icon" type="image/x-icon" href="../assets/Logo.png"> 
    </head>
<body>

    <div class="sidebar" id="sidebar">
        <div class="logo-container">
            <img src="../assets/SAKAY BRAVO LOGO_DARK YELLOW.png" class="app-logo" alt="Logo">
        </div>

        <a href="dashboard.html">Dashboard</a>
        <a href="users.html">User Management</a>
        <a href="vehicle_registration.html">Vehicle Registration</a>
        <a href="active_rides.html">Active Rides</a>
        <a href="transactions.html">Transactions</a>
        <a href="reports.html">Reports and Complaints</a>

        <div class="settings">
            <a class="active" href="system_settings.html" class="settings">Settings</a>
        </div>
    </div>

    <header class="top-nav">
        <div class="hamburger" id="hamburger">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>  
        </div>


        <div class="nav-left">
            <h1 class="nav-title">System Settings</h1>
            <h2 class="sub-title">Setup and edit settings and preferences</h2>
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

    <div class="settings-tabs">
        <button class="tab active" data-tab="general">General Settings</button>
        <button class="tab" data-tab="app-config">App Configuration</button>
        <button class="tab" data-tab="operational">Operational Settings</button>
        <button class="tab" data-tab="roles">User and Role Management</button>
        <button class="tab" data-tab="notifications">Notifications and Communication</button>
        <button class="tab" data-tab="payments">Payments and Transactions</button>
        <button class="tab" data-tab="security">Security</button>
    </div>

    <div class="system-settings-container">
        <!-- GENERAL SETTINGS -->
        <div class="tab-content active" id="general">
            <h3>General Settings</h3>

            <div class="first-column">
            <h5>Admin Dashboard Theme</h5>
            <select class="theme">
                <option>Light Theme</option>
                <option>Dark Theme</option>
            </select>
            </div>

            <div class="first-column">
            <h5>Currency</h5>
            <select class="currency" disabled>
                <option selected>Philippine Peso (PHP)</option>
            </select>
            </div>

            <div class="first-column">
            <h5>System Language</h5>
            <select class="language">
                <option>English</option>
                <option>Filipino</option>
            </select>
            </div>

            <div class="first-column">
            <h5>System Version</h5>
            <input type="text" value="v1.0.0">
            </div>

            <div class="first-column">
            <h5>System Update Frequency</h5>
            <select class="update">
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Yearly</option>
            </select>
            </div>

            <div class="first-column">
            <label class="toggle">
                <h5>Enable System Logging</h5>
                <input type="checkbox" checked>
            </label>
            </div>
        </div>

        <!-- APP CONFIGURATION -->
        <div class="tab-content" id="app-config">
            <h3>App Configuration</h3>

            <div class="first-column">
                <h5>App Name</h5>
                <input type="text" placeholder="SakayBravo">
            </div>

            <div class="first-column">
                <h5>Contact Email</h5>
                <input type="text" placeholder="sakaybravo@slu.edu.ph">
            </div>
            
            <div class="first-column">
                <h5>App Logo</h5>
                <input type="file" accept="image/*" id="uploadLogo">
                <img id="logoPreview" class="preview" src="../assets/SAKAY BRAVO LOGO_DARK YELLOW.png" alt="Logo Preview">
            </div>

            <div class="first-column">
                <label class="toggle">
                    <h5>Maintenance Mode</h5>
                    <input type="checkbox" checked>
                </label>
            </div>
        </div>

        <!-- OPERATIONAL SETTINGS -->
        <div class="tab-content" id="operational">
            <h3>Operational Settings</h3>

            <div class="first-column">
                <h5>Base Fare</h5>
                <input type="number" placeholder="30">
            </div>

            <div class="first-column">
                <h5>Fare per Kilometer</h5>
                <input type="number" placeholder="10">
            </div>
            
            <div class="first-column">
                <h5>Max Passenger per Ride</h5>
                <input type="number" placeholder="4">
            </div>

            <div class="first-column">
                <h5>Allowed Minuted for Cancellation</h5>
                <input type="number" placeholder="10">
            </div>

              <div class="first-column">
                <h5>Map Provider</h5>
                <select>
                    <option>Google Maps</option>
                    <option>OpenStreetMap</option>
                </select>
            </div>

            <div class="first-column">
                <label class="toggle">
                    <h5>Enable Location Tracking</h5>
                    <input type="checkbox" checked>
                </label>
            </div>
        </div>

        <!-- USER AND ROLE MANAGEMENT -->
        <div class="tab-content" id="roles">
            <h3>User and Role Management</h3>

            <div class="first-column">
                <label class="toggle">
                    <h5>Require Driver Verification</h5>
                    <input type="checkbox" checked>
                </label>
            </div>
            
            <div class="first-column">
                <label class="toggle">
                    <h5>Auto-Approve New Drivers</h5>
                    <input type="checkbox">
                </label>
            </div>
        </div>

        <!-- NOTIFICATIONS AND COMMUNICATION -->
        <div class="tab-content" id="notifications">
            <h3>Notifications and Communication</h3>

            <div class="first-column">
                <label class="toggle">
                    <h5>Enable Email Notifications</h5>
                    <input type="checkbox" checked>
                </label>
            </div>

            <div class="first-column">
                <label class="toggle">
                    <h5>Enable SMS/ Push Notifications</h5>
                    <input type="checkbox" checked>
                </label>
            </div>
        </div>

        <!-- PAYMENTS AND TRANSACTIONS -->
        <div class="tab-content" id="payments">
            <h3>Payments and Transactions</h3>

            <div class="first-column">
                <h5>Commission Rate (%)</h5>
                <input type="number" placeholder="10">
            </div>

            <div class="first-column">
                <h5>Accepted Payments</h5>
                <label class="toggle">
                    <input type="checkbox" checked>
                    <h5>GCash</h5>
                </label>
  
                <label class="toggle">
                    <input type="checkbox" checked>
                    <h5>PayMaya</h5>
                </label>
                
                <label class="toggle">
                    <input type="checkbox" checked>
                    <h5>Bank Transfer</h5>
                </label>

                <label class="toggle">
                    <input type="checkbox" checked>
                    <h5>Cash</h5>
                </label>
            </div>
        </div>

        <!-- SECURITY -->
        <div class="tab-content" id="security">
            <h3>Security</h3>

            <div class="first-column">
                <label class="toggle">
                    <h5>Enable Two-Factor Authentication</h5>
                    <input type="checkbox" checked>
                </label>
            </div>

             <div class="first-column">
                <label class="toggle">
                    <h5>Session Timeout</h5>
                    <input type="number" placeholder="30">
                </label>
            </div>
        </div>

        <div class="save-button-container">
            <button class="save-button">Save Changes</button>
        </div>

    </div>

    <script>
        const hamburger = document.getElementById("hamburger");
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("overlay");

        // When the hamburger menu is clicked, the sidebar will open or close.
        hamburger.addEventListener("click", () => {
            const isActive = sidebar.classList.toggle("active");
            hamburger.classList.toggle("active", isActive);
            overlay.classList.toggle("active", isActive);
        });

        // When the overlay is clicked (this is outside the menu) the sidebar will close.
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            hamburger.classList.remove("active");
            overlay.classList.remove("active");
        });

        const tabs = document.querySelectorAll(".tab");
        const contents = document.querySelectorAll(".tab-content");

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
            // Remove the 'active' status when other tab is clicked.
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            // Activate 'active' status when a new tab is clicked.
            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
            });
        });

        document.querySelector(".save-button").addEventListener("click", () => {
            alert("Settings saved successfully!");
        });

        document.getElementById('uploadLogo').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
            document.getElementById('logoPreview').src = URL.createObjectURL(file);
            }
        });
    </script>
</body>
</html>