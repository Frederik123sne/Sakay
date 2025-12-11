// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Restore scroll position
  const savedY = sessionStorage.getItem("scrollY");
  if (savedY !== null) {
    window.scrollTo(0, parseInt(savedY, 10));
    sessionStorage.removeItem("scrollY");
  }

  setupEventListeners();
  setupPopupHandlers();
  setupStatusDropdowns();
  initializePagination();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const searchBar = document.getElementById("searchInput");
  const sortByFilter = document.getElementById("sortByFilter");
  const sortOrderBtn = document.getElementById("sortOrderBtn");
  const exportBtn = document.getElementById("exportBtn");

  // Debounced search
  let searchTimeout;
  if (searchBar) {
    searchBar.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFilters();
      }, 500);
    });
  }

  // Sort by filter
  if (sortByFilter) {
    sortByFilter.addEventListener("change", () => {
      applyFilters();
    });
  }

  // Sort order toggle
  if (sortOrderBtn) {
    sortOrderBtn.addEventListener("click", () => {
      const currentOrder = sortOrderBtn.getAttribute("data-order");
      const newOrder = currentOrder === "ASC" ? "DESC" : "ASC";
      sortOrderBtn.setAttribute("data-order", newOrder);

      // Update icon and label
      const icon = sortOrderBtn.querySelector(".sort-icon");
      const text = sortOrderBtn.querySelector(".sort-text");
      icon.textContent = newOrder === "ASC" ? "↑" : "↓";
      text.textContent = newOrder === "ASC" ? "Ascending" : "Descending";

      applyFilters();
    });
  }

  // Export CSV
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV);
  }
}

/**
 * Apply filters and reload page
 */
function applyFilters() {
  const searchValue = document.getElementById("searchInput").value;
  const sortByValue = document.getElementById("sortByFilter").value;
  const sortOrderValue = document
    .getElementById("sortOrderBtn")
    .getAttribute("data-order");

  const params = new URLSearchParams();
  if (searchValue) params.append("search", searchValue);
  if (sortByValue) params.append("sort_by", sortByValue);
  if (sortOrderValue) params.append("sort_order", sortOrderValue);
  params.append("page", "1");

  window.location.href = "vehicle_registration.php?" + params.toString();
}

/**
 * Popup handlers (Add, Edit, Delete, View)
 */
function setupPopupHandlers() {
  // Add popup
  const addBtn = document.getElementById("addVehicleBtn");
  const addPopup = document.getElementById("popupForm");
  const closeAddBtn = document.getElementById("closeFormBtn");

  if (addBtn && addPopup) {
    addBtn.addEventListener("click", () => {
      addPopup.style.display = "flex";
    });
  }

  if (closeAddBtn && addPopup) {
    closeAddBtn.addEventListener("click", () => {
      addPopup.style.display = "none";
      const addForm = document.getElementById("addForm");
      if (addForm) addForm.reset();
    });
  }

  // Edit popup
  const editPopup = document.getElementById("editPopup");
  const closeEditBtn = document.getElementById("closeEditBtn");
  const editButtons = document.querySelectorAll(".edit-button");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vehicleData = JSON.parse(btn.getAttribute("data-vehicle"));

      document.getElementById("edit_userID").value = vehicleData.vehicleID;
      document.getElementById("edit_fname").value =
        vehicleData.driver_full_name || "";
      document.getElementById("edit_lname").value = ""; // Adjust if you have last name
      document.getElementById("edit_email").value =
        vehicleData.driver_email || "";
      document.getElementById("edit_roles").value = "driver"; // Default to driver

      editPopup.style.display = "flex";
    });
  });

  if (closeEditBtn && editPopup) {
    closeEditBtn.addEventListener("click", () => {
      editPopup.style.display = "none";
      const editForm = document.getElementById("editForm");
      if (editForm) editForm.reset();
    });
  }

  // Delete popup
  const deletePopup = document.getElementById("deletePopup");
  const closeDeleteBtn = document.getElementById("closeDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const deleteButtons = document.querySelectorAll(".delete-button");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vehicleID = btn.getAttribute("data-vehicle-id");
      const driverName = btn.getAttribute("data-driver-name");

      document.getElementById("delete_userID").value = vehicleID;
      document.getElementById("deleteUserName").textContent = driverName;

      deletePopup.style.display = "flex";
    });
  });

  if (closeDeleteBtn && deletePopup) {
    closeDeleteBtn.addEventListener("click", () => {
      deletePopup.style.display = "none";
    });
  }

  if (cancelDeleteBtn && deletePopup) {
    cancelDeleteBtn.addEventListener("click", () => {
      deletePopup.style.display = "none";
    });
  }

  // View popup (Card-based design)
  const viewPopup = document.getElementById("viewRegistrationPopup");
  const closeViewBtn = document.getElementById("closeViewBtn");
  const viewButtons = document.querySelectorAll(".view-button");

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vehicleData = JSON.parse(btn.getAttribute("data-vehicle"));
      populateViewPopup(vehicleData);
      viewPopup.style.display = "flex";
    });
  });

  if (closeViewBtn && viewPopup) {
    closeViewBtn.addEventListener("click", () => {
      viewPopup.style.display = "none";
    });
  }

  // Close popups when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === addPopup) {
      addPopup.style.display = "none";
      const addForm = document.getElementById("addForm");
      if (addForm) addForm.reset();
    }
    if (e.target === editPopup) {
      editPopup.style.display = "none";
      const editForm = document.getElementById("editForm");
      if (editForm) editForm.reset();
    }
    if (e.target === deletePopup) {
      deletePopup.style.display = "none";
    }
    if (e.target === viewPopup) {
      viewPopup.style.display = "none";
    }
  });
}

/**
 * Populate the view popup with vehicle data (Card-based design)
 */
function populateViewPopup(vehicle) {
  // Vehicle Card Data
  document.getElementById("viewVehicleStatus").textContent =
    vehicle.vehicle_status || "N/A";
  document.getElementById("viewBrand").textContent = vehicle.brand || "N/A";
  document.getElementById("viewModel").textContent = vehicle.model || "N/A";
  document.getElementById("viewPlateNumber").textContent =
    vehicle.plate_number || "N/A";
  document.getElementById("viewColor").textContent = vehicle.color || "N/A";
  document.getElementById("viewYear").textContent = vehicle.year || "N/A";
  document.getElementById("viewSeats").textContent =
    vehicle.seats_available || "N/A";

  // Driver Card Data
  document.getElementById("viewDriverName").textContent =
    vehicle.driver_full_name || "Unknown";
  document.getElementById("viewDriverEmail").textContent =
    vehicle.driver_email || "N/A";
  document.getElementById("viewLicenseNumber").textContent =
    vehicle.license_number || "N/A";

  // Format license expiry date
  const licenseExpiry = vehicle.license_expiry
    ? formatDate(vehicle.license_expiry)
    : "N/A";
  document.getElementById("viewLicenseExpiry").textContent = licenseExpiry;

  document.getElementById("viewLicenseType").textContent =
    vehicle.license_type || "N/A";
  document.getElementById("viewLicenseStatus").textContent =
    vehicle.license_status || "N/A";

  // Set driver image if available
  const driverImagePlaceholder = document.getElementById(
    "driverImagePlaceholder"
  );
  if (
    vehicle.profile_pic &&
    vehicle.profile_pic !== "../assets/default-profile.png"
  ) {
    // Check if there's already an img element, if not create one
    let imgElement = driverImagePlaceholder.querySelector("img");
    if (!imgElement) {
      imgElement = document.createElement("img");
      // Remove the SVG if it exists
      const svg = driverImagePlaceholder.querySelector("svg");
      if (svg) svg.remove();
      driverImagePlaceholder.appendChild(imgElement);
    }
    imgElement.src = vehicle.profile_pic;
    imgElement.alt = vehicle.driver_full_name || "Driver";
  } else {
    // Make sure SVG is visible if no image
    const svg = driverImagePlaceholder.querySelector("svg");
    if (!svg) {
      driverImagePlaceholder.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="6" r="4" stroke="#ffffff" stroke-width="1.5"/>
          <path d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
      `;
    }
  }
}

/**
 * Helper function to format dates
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear();
}

/**
 * Handle status dropdown changes
 */
function setupStatusDropdowns() {
    const popup = document.getElementById("statusPopup");
    const closeBtn = document.getElementById("closeStatusBtn");
    const cancelBtn = document.getElementById("cancelStatusBtn");
    const confirmBtn = document.getElementById("confirmStatusBtn");
    const nameLabel = document.getElementById("statusUserName");
    const newValueLabel = document.getElementById("statusNewValue");

    if (!popup || !closeBtn || !cancelBtn || !confirmBtn || !nameLabel || !newValueLabel) {
        console.error("Status popup elements not found.");
        return;
    }

    let selectedDropdown = null;

    const statusDropdowns = document.querySelectorAll(".status-dropdown");

    statusDropdowns.forEach((dropdown) => {
        dropdown.addEventListener("change", (e) => {
            const currentStatus = e.target.getAttribute("data-original-status");
            const newStatusValue = e.target.value;

            if (newStatusValue === currentStatus) return;

            selectedDropdown = e.target;

            // Get driver name from the table row
            const tr = e.target.closest("tr");
            const driverName = tr ? tr.querySelector("td:first-child").textContent.trim() : "Unknown";

            // Get the actual text
            const newStatusText = selectedDropdown.options[selectedDropdown.selectedIndex].text;

            // Update popup text
            nameLabel.textContent = driverName;
            newValueLabel.textContent = newStatusText;

            // Show popup
            popup.style.display = "block";
            popup.classList.add("active");
        });
    });

    // Function to close the popup
    const closePopup = () => {
        if (selectedDropdown) {
            // Revert dropdown value if user cancels
            selectedDropdown.value = selectedDropdown.getAttribute("data-original-status");
            selectedDropdown = null;
        }
        popup.style.display = "none";
        popup.classList.remove("active");
    };

    // Close handlers
    closeBtn.addEventListener("click", closePopup);
    cancelBtn.addEventListener("click", closePopup);
    popup.addEventListener("click", (e) => {
        if (e.target === popup) closePopup();
    });

    // Confirm status change
    confirmBtn.addEventListener("click", () => {
        if (!selectedDropdown) return;

        const newStatusText = selectedDropdown.options[selectedDropdown.selectedIndex].text;
        const userID = selectedDropdown.getAttribute("data-user-id");

        const form = document.createElement("form");
        form.method = "POST";
        form.action = "user_management.php";

        const addHidden = (name, value) => {
            const i = document.createElement("input");
            i.type = "hidden";
            i.name = name;
            i.value = value;
            form.appendChild(i);
        };

        addHidden("action", "update_status");
        addHidden("userID", userID);
        addHidden("status", newStatusText); // Uses actual text rather than the value

        // Preserve filters if function exists
        if (typeof preserveFiltersInForm === "function") preserveFiltersInForm(form);

        document.body.appendChild(form);
        form.submit();
    });
}


/**
 * Initialize pagination
 */
function initializePagination() {
  const paginationContainer = document.getElementById("paginationButtons");
  if (!paginationContainer || !window.pageData) return;

  const { totalPages, currentPage } = window.pageData;
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  // Prev button
  paginationContainer.appendChild(
    createPaginationButton("Previous", currentPage - 1, currentPage === 1)
  );

  // Page range
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First + ellipsis
  if (startPage > 1) {
    paginationContainer.appendChild(createPaginationButton("1", 1));
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.appendChild(
      createPaginationButton(i, i, false, i === currentPage)
    );
  }

  // Ellipsis + last
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
    paginationContainer.appendChild(
      createPaginationButton(totalPages, totalPages)
    );
  }

  // Next button
  paginationContainer.appendChild(
    createPaginationButton("Next", currentPage + 1, currentPage === totalPages)
  );
}

/**
 * Create a pagination button
 */
function createPaginationButton(label, page, disabled = false, active = false) {
  const button = document.createElement("button");
  button.className = "pagination-btn";
  if (active) button.classList.add("active");
  if (disabled) button.classList.add("disabled");
  button.textContent = label;
  button.disabled = disabled;

  if (!disabled) {
    button.addEventListener("click", () => {
      navigateToPage(page);
    });
  }

  return button;
}

/**
 * Navigate to a specific page
 */
function navigateToPage(page) {
  sessionStorage.setItem("scrollY", window.scrollY);
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.location.href = "vehicle_registration.php?" + params.toString();
}

/**
 * Export CSV
 */
function exportToCSV() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "vehicle_registration.php";

  const action = document.createElement("input");
  action.type = "hidden";
  action.name = "action";
  action.value = "export";
  form.appendChild(action);

  const search = document.getElementById("searchInput").value;
  const sortBy = document.getElementById("sortByFilter").value;
  const sortOrder = document
    .getElementById("sortOrderBtn")
    .getAttribute("data-order");

  if (search) addHidden(form, "search", search);
  if (sortBy) addHidden(form, "sort_by", sortBy);
  if (sortOrder) addHidden(form, "sort_order", sortOrder);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/**
 * Helper to add hidden input
 */
function addHidden(form, name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

/**
 * Preserve filters in form
 */
function preserveFiltersInForm(form) {
  const currentParams = new URLSearchParams(window.location.search);
  for (const [key, value] of currentParams) {
    addHidden(form, key, value);
  }
}

// Hamburger menu
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

if (hamburger && sidebar && overlay) {
  hamburger.addEventListener("click", () => {
    const isActive = sidebar.classList.toggle("active");
    hamburger.classList.toggle("active", isActive);
    overlay.classList.toggle("active", isActive);
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    hamburger.classList.remove("active");
    overlay.classList.remove("active");
  });
}
