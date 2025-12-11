// public/js/booking_history.js
// Booking History Page - Fetch and display passenger bookings with sorting

window.addEventListener("load", async function () {
  const api = window.api;
  let bookingsData = [];
  let currentSortOrder = "desc";

  // ============================================
  // FETCH BOOKINGS
  // ============================================

  async function fetchBookings() {
    try {
      const response = await api.getPassengerBookings();
      
      if (response.success) {
        bookingsData = response.data || [];
        
        displayStatistics(bookingsData);
        displayBookings(bookingsData);
      } else {
        showError("Failed to load booking history");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showError("Error loading booking history: " + error.message);
    }
  }

  setTimeout(async () => {
    await fetchBookings();
  }, 500);

  // ============================================
  // DISPLAY STATISTICS
  // ============================================

  function displayStatistics(bookings) {
    const completedBookings = bookings.filter(
      b => b.booking_status === "completed"
    );

    const ridesTaken = completedBookings.length;
    const totalDistance = "N/A";
    const totalPayment = completedBookings.reduce(
      (sum, b) => sum + parseFloat(b.total_fare || 0), 
      0
    );
    const averageFare = ridesTaken > 0 
      ? (totalPayment / ridesTaken).toFixed(2) 
      : 0;

    const cards = document.querySelectorAll(".card");
    if (cards.length >= 4) {
      cards[0].querySelector(".number").textContent = ridesTaken;
      cards[1].querySelector(".number").textContent = totalDistance;
      cards[2].querySelector(".number").textContent = `₱${totalPayment.toFixed(2)}`;
      cards[3].querySelector(".number").textContent = `₱${averageFare}`;
    }
  }

  // ============================================
  // DISPLAY BOOKINGS TABLE
  // ============================================

  function displayBookings(bookings) {
    const tbody = document.querySelector(".transactions-information tbody");
    
    if (!tbody) {
      console.error("Table tbody not found");
      return;
    }

    tbody.innerHTML = "";

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
            No bookings found. <a href="/passenger/book-ride">Book your first ride!</a>
          </td>
        </tr>
      `;
      updatePaginationInfo(0, 0, 0);
      return;
    }

    const sortedBookings = sortBookingsByDate(bookings, currentSortOrder);

    sortedBookings.forEach(booking => {
      const row = createBookingRow(booking);
      tbody.appendChild(row);
    });

    updatePaginationInfo(1, sortedBookings.length, sortedBookings.length);
  }

  // ============================================
  // CREATE BOOKING ROW
  // ============================================

  function createBookingRow(booking) {
    const row = document.createElement("tr");

    const date = new Date(booking.created_at);
    const formattedDate = date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const reference = booking.bookingID || `BK-${date.getTime()}`;
    const driverName = `${booking.driver_first_name || "Unknown"} ${booking.driver_last_name || ""}`.trim();
    const statusBadge = createStatusBadge(booking.booking_status);
    const paymentBadge = createPaymentBadge(booking.payment_status);

    row.innerHTML = `
      <td>${reference}</td>
      <td>${formattedDate}</td>
      <td>${booking.pickup_location || booking.origin || "N/A"}</td>
      <td>${booking.dropoff_location || booking.destination || "N/A"}</td>
      <td>${driverName}</td>
      <td>${statusBadge}</td>
      <td>${paymentBadge}</td>
      <td>₱${parseFloat(booking.total_fare || 0).toFixed(2)}</td>
    `;

    return row;
  }

  // ============================================
  // STATUS BADGES
  // ============================================

  function createStatusBadge(status) {
    const statusColors = {
      requested: "#FFA500",
      confirmed: "#2196F3",
      ongoing: "#9C27B0",
      completed: "#4CAF50",
      cancelled: "#F44336",
      no_show: "#757575",
      driver_cancelled: "#E91E63",
      passenger_cancelled: "#FF5722"
    };

    const color = statusColors[status] || "#666";
    const displayText = status.replace(/_/g, " ").toUpperCase();

    return `<span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap;">${displayText}</span>`;
  }

  function createPaymentBadge(status) {
    const paymentColors = {
      pending: "#FFA500",
      paid: "#4CAF50",
      refunded: "#2196F3",
      failed: "#F44336",
      cancelled: "#757575",
      partial: "#FF9800"
    };

    const color = paymentColors[status] || "#666";
    const displayText = status.toUpperCase();

    return `<span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">${displayText}</span>`;
  }

  // ============================================
  // SORTING
  // ============================================

  function sortBookingsByDate(bookings, order) {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);

      if (order === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }

  const sortBtn = document.getElementById("sortOrderBtn");
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";

      const sortText = sortBtn.querySelector(".sort-text");
      const sortIcon = sortBtn.querySelector(".sort-icon");
      
      if (currentSortOrder === "asc") {
        sortText.textContent = "ASCENDING";
        sortIcon.textContent = "↑";
      } else {
        sortText.textContent = "DESCENDING";
        sortIcon.textContent = "↓";
      }

      displayBookings(bookingsData);
    });
  }

  // ============================================
  // SEARCH FILTER
  // ============================================

  const searchInput = document.querySelector(".filter-search-bar");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      if (searchTerm === "") {
        displayBookings(bookingsData);
        return;
      }

      const filtered = bookingsData.filter(booking => {
        const driverName = `${booking.driver_first_name || ""} ${booking.driver_last_name || ""}`.toLowerCase();
        const pickup = (booking.pickup_location || booking.origin || "").toLowerCase();
        const dropoff = (booking.dropoff_location || booking.destination || "").toLowerCase();
        const reference = (booking.bookingID || "").toLowerCase();
        const status = (booking.booking_status || "").toLowerCase();

        return (
          driverName.includes(searchTerm) ||
          pickup.includes(searchTerm) ||
          dropoff.includes(searchTerm) ||
          reference.includes(searchTerm) ||
          status.includes(searchTerm)
        );
      });

      displayBookings(filtered);
    });
  }

  // ============================================
  // PAGINATION INFO
  // ============================================

  function updatePaginationInfo(page, showing, total) {
    const paginationInfo = document.querySelector(".pagination-info");
    if (paginationInfo) {
      if (total === 0) {
        paginationInfo.innerHTML = "No bookings to display";
      } else {
        paginationInfo.innerHTML = `
          Showing <strong>1</strong> to <strong>${showing}</strong> of
          <strong>${total}</strong> bookings
        `;
      }
    }
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  function showError(message) {
    const tbody = document.querySelector(".transactions-information tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #F44336;">
            ${message}
          </td>
        </tr>
      `;
    }
  }
});