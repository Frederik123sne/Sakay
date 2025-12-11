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
 * Setup all event listeners
 */
function setupEventListeners() {
  const searchBar = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const sortByFilter = document.getElementById("sortByFilter");
  const sortOrderBtn = document.getElementById("sortOrderBtn");
  const exportBtn = document.getElementById("exportBtn");

  // Search with debounce
  let searchTimeout;
  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFilters();
      }, 500);
    });
  }

  // Role filter
  if (roleFilter) {
    roleFilter.addEventListener("change", () => {
      applyFilters();
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

      // Update button display
      const icon = sortOrderBtn.querySelector(".sort-icon");
      const text = sortOrderBtn.querySelector(".sort-text");
      icon.textContent = newOrder === "ASC" ? "↑" : "↓";
      text.textContent = newOrder === "ASC" ? "Ascending" : "Descending";

      applyFilters();
    });
  }

  // Export button
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV);
  }
}

/**
 * Apply all filters and reload page
 */
function applyFilters() {
  const searchValue = document.getElementById("searchInput").value;
  const roleValue = document.getElementById("roleFilter").value;
  const sortByValue = document.getElementById("sortByFilter").value;
  const sortOrderValue = document
    .getElementById("sortOrderBtn")
    .getAttribute("data-order");

  const params = new URLSearchParams();

  if (searchValue) params.append("search", searchValue);
  if (roleValue) params.append("role", roleValue);
  if (sortByValue) params.append("sort_by", sortByValue);
  if (sortOrderValue) params.append("sort_order", sortOrderValue);

  // Reset to page 1 when filters change
  params.append("page", "1");

  window.location.href = "user_management.php?" + params.toString();
}

/**
 * Setup popup handlers
 */
function setupPopupHandlers() {
  // Add popup
  const addBtn = document.getElementById("openFormBtn");
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
      document.getElementById("addForm").reset();
    });
  }

  // Edit popup
  const editPopup = document.getElementById("editPopup");
  const closeEditBtn = document.getElementById("closeEditBtn");
  const editButtons = document.querySelectorAll(".edit-button");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const userData = JSON.parse(btn.getAttribute("data-user"));

      document.getElementById("edit_userID").value = userData.userID;
      document.getElementById("edit_fname").value = userData.first_name;
      document.getElementById("edit_lname").value = userData.last_name;
      document.getElementById("edit_email").value = userData.email;
      document.getElementById("edit_roles").value = userData.role;

      editPopup.style.display = "flex";
    });
  });

  if (closeEditBtn && editPopup) {
    closeEditBtn.addEventListener("click", () => {
      editPopup.style.display = "none";
      document.getElementById("editForm").reset();
    });
  }

  // Delete popup
  const deletePopup = document.getElementById("deletePopup");
  const closeDeleteBtn = document.getElementById("closeDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const deleteButtons = document.querySelectorAll(".delete-button");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const userID = btn.getAttribute("data-user-id");
      const userName = btn.getAttribute("data-user-name");

      document.getElementById("delete_userID").value = userID;
      document.getElementById("deleteUserName").textContent = userName;

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

  // Close popups when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === addPopup) {
      addPopup.style.display = "none";
      document.getElementById("addForm").reset();
    }
    if (e.target === editPopup) {
      editPopup.style.display = "none";
      document.getElementById("editForm").reset();
    }
    if (e.target === deletePopup) {
      deletePopup.style.display = "none";
    }
  });
}


/**
 * Setup status dropdown handlers
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
            const originalStatus = e.target.getAttribute("data-original-status");
            const newStatusValue = e.target.value;

            if (newStatusValue === "default" || newStatusValue === originalStatus) {
                e.target.value = originalStatus;
                return;
            }

            selectedDropdown = e.target;

            // Get user name from the correct table column
            const row = e.target.closest("tr");
            const nameCell = row ? row.querySelector("td:nth-child(2)") : null; // assuming 2nd column has user name
            const userName = nameCell ? nameCell.innerText.trim() : "this user";

            // Get the actual text of the selected option
            const newStatusText = selectedDropdown.options[selectedDropdown.selectedIndex].text;

            // Update popup
            nameLabel.innerText = userName;
            newValueLabel.innerText = newStatusText;

            // Show popup
            popup.classList.add("active");
            popup.style.display = "flex";
        });
    });

    // Close popup
    const closePopup = () => {
        if (selectedDropdown) {
            selectedDropdown.value = selectedDropdown.getAttribute("data-original-status");
            selectedDropdown = null;
        }
        popup.classList.remove("active");
        popup.style.display = "none";
    };

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
        addHidden("status", newStatusText); // Uses actual text rather than value

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

  // Clear existing buttons
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = createPaginationButton(
    "Previous",
    currentPage - 1,
    currentPage === 1
  );
  paginationContainer.appendChild(prevBtn);

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page + ellipsis
  if (startPage > 1) {
    paginationContainer.appendChild(createPaginationButton("1", 1));
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const btn = createPaginationButton(i, i, false, i === currentPage);
    paginationContainer.appendChild(btn);
  }

  // Ellipsis + last page
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
  const nextBtn = createPaginationButton(
    "Next",
    currentPage + 1,
    currentPage === totalPages
  );
  paginationContainer.appendChild(nextBtn);
}

/**
 * Create pagination button
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
 * Navigate to specific page
 */
function navigateToPage(page) {
  // Save scroll position before reload
  sessionStorage.setItem("scrollY", window.scrollY);
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.location.href = "user_management.php?" + params.toString();
}

/**
 * Export to CSV
 */
function exportToCSV() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "user_management.php";

  const actionInput = document.createElement("input");
  actionInput.type = "hidden";
  actionInput.name = "action";
  actionInput.value = "export";
  form.appendChild(actionInput);

  // Include current filters
  const searchInput = document.getElementById("searchInput");
  const roleSelect = document.getElementById("roleFilter");
  const sortBySelect = document.getElementById("sortByFilter");
  const sortOrderBtn = document.getElementById("sortOrderBtn");

  if (searchInput && searchInput.value) {
    const search = document.createElement("input");
    search.type = "hidden";
    search.name = "search";
    search.value = searchInput.value;
    form.appendChild(search);
  }

  if (roleSelect && roleSelect.value) {
    const role = document.createElement("input");
    role.type = "hidden";
    role.name = "role";
    role.value = roleSelect.value;
    form.appendChild(role);
  }

  if (sortBySelect && sortBySelect.value) {
    const sortBy = document.createElement("input");
    sortBy.type = "hidden";
    sortBy.name = "sort_by";
    sortBy.value = sortBySelect.value;
    form.appendChild(sortBy);
  }

  if (sortOrderBtn) {
    const sortOrder = document.createElement("input");
    sortOrder.type = "hidden";
    sortOrder.name = "sort_order";
    sortOrder.value = sortOrderBtn.getAttribute("data-order");
    form.appendChild(sortOrder);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/**
 * Preserve filters in form submission
 */
function preserveFiltersInForm(form) {
  const currentParams = new URLSearchParams(window.location.search);
  for (const [key, value] of currentParams) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
}

// Hamburger menu handlers (if exists)
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
