document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
      VEHICLE TABLE
  =============================== */
  const vehicleTbody = document.querySelector('#vehicleTable tbody');
  const vehicleApiUrl = '../../routes/admin_dashboard.php?action=vehicles&status=pending';

  async function fetchPendingVehicles() {
    if (!vehicleTbody) return;
    try {
      const res = await fetch(vehicleApiUrl);
      if (!res.ok) throw new Error('Network error');
      const payload = await res.json();
      if (!payload.success) throw new Error('API returned error');
      renderVehicleRows(payload.vehicles || []);
    } catch (err) {
      console.error('Failed to load pending vehicles', err);
      vehicleTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#c00;padding:14px;">Failed to load pending vehicles</td></tr>';
    }
  }

  function renderVehicleRows(vehicles) {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      vehicleTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#666;padding:14px;">No pending vehicles</td></tr>';
      return;
    }
    vehicleTbody.innerHTML = '';
    vehicles.forEach(v => {
      const owner = escapeHtml(v.driver_full_name || 'Unknown');
      const vehicleLabel = escapeHtml([v.brand, v.model, v.plate_number].filter(Boolean).join(' '));
      const vehicleID = encodeURIComponent(v.vehicleID);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${owner}</td>
        <td>${vehicleLabel}</td>
        <td><span class="pending">Pending</span></td>
        <td>
          <button class="btn-approve" data-id="${vehicleID}" title="Approve" style="margin-right:8px;">
            <img src="../assets/check-mark.svg" alt="Approve" width="18" height="18">
          </button>
          <button class="btn-reject" data-id="${vehicleID}" title="Reject">
            <img src="../assets/reject.svg" alt="Reject" width="18" height="18">
          </button>
        </td>
      `;
      vehicleTbody.appendChild(tr);
    });
  }

  // Event delegation for approve/reject buttons
  if (vehicleTbody) {
    vehicleTbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-approve, .btn-reject');
      if (!btn) return;
      const id = decodeURIComponent(btn.dataset.id);
      const isApprove = btn.classList.contains('btn-approve');
      const newStatus = isApprove ? 'active' : 'rejected';
      if (!confirm(`Change vehicle status to "${newStatus}"?`)) return;
      try {
        const fd = new FormData();
        fd.append('action', 'update_status');
        fd.append('vehicleID', id);
        fd.append('status', newStatus);
        const res = await fetch('../../routes/admin_dashboard.php?action=vehicles', {
          method: 'POST',
          body: fd,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const json = await res.json();
        if (json.success) {
          // remove row
          const row = btn.closest('tr');
          if (row) row.remove();
          // if last row removed, show empty state
          if (!vehicleTbody.querySelector('tr')) {
            vehicleTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#666;padding:14px;">No pending vehicles</td></tr>';
          }
        } else {
          alert(json.message || 'Failed to update status');
        }
      } catch (err) {
        console.error('Status update failed', err);
        alert('Failed to update status');
      }
    });
    fetchPendingVehicles();
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&"'<>]/g, function (c) {
      return { '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }


  /* ===============================
     Ride Activity Chart
  =============================== */
  const rideCanvas = document.getElementById('rideActivityChart');

  if (rideCanvas) {
    const rideCtx = rideCanvas.getContext('2d');
    let rideActivityChartInstance = null;

    function renderRideActivityChart(labels, data) {
      if (rideActivityChartInstance) rideActivityChartInstance.destroy();

      rideActivityChartInstance = new Chart(rideCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Rides',
            data,
            borderColor: '#5B90F6',
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointHitRadius: 12,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#5B90F6',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              displayColors: false,
              padding: 10,
              titleFont: { size: 16 },
              bodyFont: { size: 15 },
              callbacks: {
                label: (ctx) => Math.round(ctx.raw)
              }
            }
          },
          interaction: { mode: 'nearest', intersect: true },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#777", padding: 10, font: { size: 14 }, autoSkip: true, maxTicksLimit: 12, maxRotation: 45 } },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(0,0,0,0.05)", borderDash: [5, 5] },
              ticks: {
                color: "#777",
                padding: 10,
                font: { size: 13 },
                callback: v => Math.round(v)
              },
              title: {
                display: true,
                text: 'Number of Rides',
                color: '#555',
                font: { size: 14 }
              }
            }
          },
          layout: { padding: 20 },
          responsive: true,
          maintainAspectRatio: false,
          animation: false
        }
      });
    }

    async function loadRideActivity() {
      try {
        const res = await fetch("../../routes/admin_dashboard.php?action=ride_activity");
        if (!res.ok) throw new Error("Failed to load ride activity");

        const data = await res.json();
        if (!data.success) return;

        renderRideActivityChart(data.labels, data.counts);

      } catch (err) {
        console.error("loadRideActivity error:", err);
      }
    }

    loadRideActivity();
    setInterval(loadRideActivity, 60000);
  }


  /* ===============================
     USER GROWTH CHART
  =============================== */

  const userCanvas = document.getElementById('userGrowthChart');
  let userGrowthChartInstance = null;

  if (userCanvas) {
    const userCtx = userCanvas.getContext('2d');

    userGrowthChartInstance = new Chart(userCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: '',
          data: [300, 350, 340, 400, 480, 600],
          borderColor: '#FACC15',
          backgroundColor: 'rgba(250, 204, 21, 0.25)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointHitRadius: 12,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#FACC15',
          pointBorderWidth: 3,
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            displayColors: false,
            padding: 12,
            titleFont: { size: 16 },
            bodyFont: { size: 15 },
            callbacks: {
              label: (ctx) => Math.round(ctx.raw)
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#777",
              padding: 10,
              autoSkip: true,
              maxTicksLimit: 12,
              maxRotation: 45,
              font: { size: 14 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)", borderDash: [5, 5] },
            ticks: {
              color: "#777",
              padding: 10,
              font: { size: 13 },
              callback: v => Math.round(v)
            },
            title: {
              display: true,
              text: 'Number of Users',
              color: '#555',
              font: { size: 14 }
            }
          }
        },
        layout: { padding: 20 }
      }
    });
  }

  /* ===============================
     LOAD USER GROWTH + STATS
  =============================== */

  async function loadUserGrowth(months = 6, showYear = false) {
    try {
      const res = await fetch(`../../routes/admin_dashboard.php?action=user_growth&months=${months}`);
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      if (!data.success) return;

      let labels = data.labels;

      if (showYear && Array.isArray(data.keys)) {
        labels = data.keys.map((k, i) => {
          const year = k.split('-')[0];
          return `${labels[i]} ${year}`;
        });
      }

      userGrowthChartInstance.data.labels = labels;
      userGrowthChartInstance.data.datasets[0].data = data.counts;
      userGrowthChartInstance.update();

    } catch (err) {
      console.error("loadUserGrowth error:", err);
    }
  }

  async function loadUserStats() {
    try {
      const res = await fetch("../../routes/admin_dashboard.php?action=user_counts");
      const data = await res.json();

      if (data.success) {
        const set = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };

        set("totalUsersCount", data.total);
        set("activeUsersCount", data.active);
        set("inactiveUsersCount", data.inactive);
        set("suspendedUsersCount", data.suspended);
        set("adminUsersCount", data.admin);
      }
    } catch (err) {
      console.error("loadUserStats error:", err);
    }
  }

  loadUserStats();

  const monthsSelect = document.getElementById("growthMonthsSelect");
  const showYearCheckbox = document.getElementById("growthShowYear");

  const initialMonths = monthsSelect ? Number(monthsSelect.value) : 6;
  const initialShowYear = showYearCheckbox ? showYearCheckbox.checked : false;

  loadUserGrowth(initialMonths, initialShowYear);

  if (monthsSelect)
    monthsSelect.addEventListener("change", () => {
      loadUserGrowth(Number(monthsSelect.value), showYearCheckbox.checked);
    });

  if (showYearCheckbox)
    showYearCheckbox.addEventListener("change", () => {
      loadUserGrowth(Number(monthsSelect.value), showYearCheckbox.checked);
    });

  setInterval(loadUserStats, 60000);
  setInterval(() => {
    loadUserGrowth(Number(monthsSelect.value), showYearCheckbox.checked);
  }, 60000);

  /* ===============================
   RECENT REPORTS
  =============================== */
  
  const recentReportsList = document.getElementById('recentReportsList');
  if (recentReportsList) {
    async function loadRecentReports() {
      recentReportsList.innerHTML = '<li style="text-align:center;color:#888;padding:14px;">Loading...</li>';
      try {
        const res = await fetch('../../routes/admin_dashboard.php?action=recent_reports');
        if (!res.ok) throw new Error('Network error');
        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          throw new Error('Invalid JSON response');
        }
        if (!data.success) throw new Error('API error');
        const reports = data.reports || [];
        if (reports.length === 0) {
          recentReportsList.innerHTML = '<li style="text-align:center;color:#888;padding:14px;">No reports today</li>';
          return;
        }
        recentReportsList.innerHTML = '';
        reports.forEach(r => {
          const li = document.createElement('li');
          li.className = 'report-item';
          // Format time (HH:MM)
          const time = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          li.innerHTML = `
              <div class="left">
                <span class="dot"></span>
                <div class="text">
                  <strong>${escapeHtml(r.report_type || 'Report')}</strong>
                  <p>${escapeHtml(r.subject || '')}</p>
                  <span class="time">${time}</span>
                </div>
              </div>
            `;
          recentReportsList.appendChild(li);
        });
      } catch (err) {
        recentReportsList.innerHTML = '<li style="text-align:center;color:#c00;padding:14px;">Failed to load reports</li>';
        console.error('Failed to load recent reports', err);
      }
    }
    loadRecentReports();
    setInterval(loadRecentReports, 60000);
  }
}); 