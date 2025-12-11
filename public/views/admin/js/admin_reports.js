// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Restore scroll position
  const savedY = sessionStorage.getItem("scrollY");
  if (savedY !== null) {
    window.scrollTo(0, parseInt(savedY, 10));
    sessionStorage.removeItem("scrollY");
  }

  setupEventListeners();
  setupStatusDropdowns();
  initializePagination();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  const searchBar = document.getElementById("searchInput");
  const sortByFilter = document.getElementById("sortByFilter");
  const sortOrderBtn = document.getElementById("sortOrderBtn");
  const exportBtn = document.getElementById("exportBtn");

  // Search with debounce
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
  const sortByValue = document.getElementById("sortByFilter").value;
  const sortOrderValue = document
    .getElementById("sortOrderBtn")
    .getAttribute("data-order");

  const params = new URLSearchParams();

  if (searchValue) params.append("search", searchValue);
  if (sortByValue) params.append("sort_by", sortByValue);
  if (sortOrderValue) params.append("sort_order", sortOrderValue);

  // Reset to page 1 when filters change
  params.append("page", "1");

  window.location.href = "reports.php?" + params.toString();
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

        // Get reporter name from first column
        const row = e.target.closest("tr");
        const reporterCell = row ? row.querySelector("td:nth-child(1) span") : null;
        const reporterName = reporterCell ? reporterCell.innerText.trim() : "this reporter";

        // Get the actual text of the selected option
        const newStatusText = selectedDropdown.options[selectedDropdown.selectedIndex].text;

        // Update popup
        nameLabel.innerText = reporterName;
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
      const reportID = selectedDropdown.getAttribute("data-report-id");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = "reports.php";

      const addHidden = (name, value) => {
        const i = document.createElement("input");
          i.type = "hidden";
          i.name = name;
          i.value = value;
          form.appendChild(i);
      };

      addHidden("action", "update_status");
      addHidden("reportID", reportID);
      addHidden("status", newStatusText); // Uses the actual text rather than value

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
  sessionStorage.setItem("scrollY", window.scrollY);
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.location.href = "reports.php?" + params.toString();
}

/**
 * Export to CSV
 */
function exportToCSV() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "reports.php";

  const actionInput = document.createElement("input");
  actionInput.type = "hidden";
  actionInput.name = "action";
  actionInput.value = "export";
  form.appendChild(actionInput);

  // Include current filters
  const searchInput = document.getElementById("searchInput");
  const sortBySelect = document.getElementById("sortByFilter");
  const sortOrderBtn = document.getElementById("sortOrderBtn");

  if (searchInput && searchInput.value) {
    const search = document.createElement("input");
    search.type = "hidden";
    search.name = "search";
    search.value = searchInput.value;
    form.appendChild(search);
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

// Optional: Hamburger menu handlers (if sidebar present)
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
