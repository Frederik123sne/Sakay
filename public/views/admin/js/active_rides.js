/**
 * Active Rides JavaScript - Client-side enhancements only
 * No AJAX calls - all data is server-side rendered
 */

(function () {
    'use strict';

    // Search functionality with debouncing
    const searchBar = document.querySelector('.filter-search-bar');
    let searchTimeout;

    if (searchBar) {
        searchBar.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // Auto-submit search form after user stops typing
                document.getElementById('filterForm').submit();
            }, 800);
        });
    }

    // Table row highlighting on hover
    const tableRows = document.querySelectorAll('#ridesTable tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', function () {
            // Remove previous selection
            tableRows.forEach(r => r.classList.remove('selected'));
            // Add selection to clicked row
            this.classList.add('selected');
        });
    });

    // Auto-refresh notification (optional)
    let autoRefreshInterval;
    const enableAutoRefresh = false; // Set to true if you want auto-refresh

    if (enableAutoRefresh) {
        autoRefreshInterval = setInterval(() => {
            // Show refresh notification
            showNotification('Refreshing data...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }, 30000); // Refresh every 30 seconds
    }

    // Notification helper
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        #ridesTable tbody tr {
            transition: background-color 0.2s ease;
            cursor: pointer;
        }
        #ridesTable tbody tr:hover {
            background-color: rgba(255, 193, 7, 0.1);
        }
        #ridesTable tbody tr.selected {
            background-color: rgba(255, 193, 7, 0.2);
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-ongoing {
            background-color: #4CAF50;
            color: white;
        }
        .status-en-route, .status-waiting-pickup {
            background-color: #2196F3;
            color: white;
        }
        .status-accepted {
            background-color: #FF9800;
            color: white;
        }
        .status-completed {
            background-color: #9E9E9E;
            color: white;
        }
    `;
    document.head.appendChild(style);

    // Prevent multiple form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Loading...';
            }
        });
    });

    // Print functionality
    window.printTable = function () {
        window.print();
    };

    console.log('Active Rides page initialized - SSR mode');
})();