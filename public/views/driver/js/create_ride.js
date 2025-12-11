// create_ride.js - FIXED: Removed farePerSeat and notes, fixed submission

// ==================== CONSTANTS ====================
const SLU_BAKAKENG = {
  lat: 16.38481,
  lng: 120.59396,
  address:
    "Saint Louis University - Maryheights Campus, Bakakeng, Baguio City, Benguet, Philippines",
  radius: 200,
};

// ==================== GLOBAL VARIABLES ====================
let createRideMap;
let startMarker;
let endMarker;
let routeLine;
let sluMarker;
let startPoint = null;
let endPoint = null;
let startAddress = null;
let endAddress = null;
let estimatedDurationMinutes = 0;
let maxSeats = 4;

// Replace the profile loading section in your DOMContentLoaded

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Driver rides page loading...");

  const api = window.api;

  try {
    const response = await api.getDriverProfile();
    if (response.success) {
      const profile = response.data;
      document.getElementById(
        "welcomeMessage"
      ).textContent = `Accept a ride request, ${profile.first_name}!`;
      document.getElementById(
        "userName"
      ).textContent = `${profile.first_name} ${profile.last_name}`;
      document.getElementById("userEmail").textContent = profile.email;

      // Handle profile picture with fallback
      if (profile.profile_pic) {
        const photoPath = `/${profile.profile_pic}`;
        const profileIcon = document.getElementById("profileIcon");
        const dropdownProfilePic = document.getElementById("dropdownProfilePic");

        // Set src and add error handlers
        profileIcon.src = photoPath;
        dropdownProfilePic.src = photoPath;

        // Add error fallback
        handleProfilePictureError(profileIcon);
        handleProfilePictureError(dropdownProfilePic);
      }
    }

    const vehicleResponse = await api.getDriverVehicles();
    if (vehicleResponse.success && vehicleResponse.data.length > 0) {
      const activeVehicle = vehicleResponse.data.find(
        (v) => v.vehicle_status === "active"
      );
      if (activeVehicle) {
        maxSeats = activeVehicle.seats_available;
        console.log("Vehicle found:", {
          vehicleID: activeVehicle.vehicleID,
          brand: activeVehicle.brand,
          model: activeVehicle.model,
          seats_available: activeVehicle.seats_available
        });
        console.log(`Max seats set to: ${maxSeats}`);
      } else {
        console.log("No active vehicle found, using default maxSeats = 4");
      }
    } else {
      console.log("No vehicles found, using default maxSeats = 4");
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }

  setupLogoutHandler();
  setupProfileDropdown();
  initializeMainMap();
  loadActiveRides();
});

// ==================== DISTANCE CALCULATION ====================
function calculateDistance(point1, point2) {
  const R = 6371;
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
    Math.cos((point2.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==================== CHECK IF POINT IS NEAR SLU ====================
function isNearSLUBakakeng(lat, lng) {
  const distance = calculateDistance(
    { lat: lat, lng: lng },
    { lat: SLU_BAKAKENG.lat, lng: SLU_BAKAKENG.lng }
  );
  return distance <= SLU_BAKAKENG.radius / 1000;
}

// ==================== TRAVEL TIME CALCULATION ====================
function calculateRealisticTravelTime(distanceKm) {
  let baseSpeed;

  if (distanceKm < 2) {
    baseSpeed = 15;
  } else if (distanceKm < 5) {
    baseSpeed = 20;
  } else if (distanceKm < 10) {
    baseSpeed = 25;
  } else {
    baseSpeed = 30;
  }

  let travelMinutes = (distanceKm / baseSpeed) * 60;
  const trafficFactor = 1 + (Math.random() * 0.2 + 0.2);
  travelMinutes *= trafficFactor;
  const stopTime = Math.min(distanceKm * 1.5, 15);
  travelMinutes += stopTime;

  return Math.round(travelMinutes / 5) * 5;
}

// ==================== DATE/TIME HELPER ====================
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ==================== DEPARTURE TIME VALIDATION ====================
function validateDepartureTime() {
  const departureInput = document.getElementById("departureTime");

  if (!departureInput || !departureInput.value) {
    return false;
  }

  const departureDate = new Date(departureInput.value);
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60000);

  let errorMessage = "";

  if (departureDate < thirtyMinutesFromNow) {
    errorMessage = "Rides must be created at least 30 minutes in advance";
  } else if (departureDate > sevenDaysFromNow) {
    errorMessage = "Rides can only be created up to 7 days in advance";
  }

  let errorDiv = document.getElementById("departure-error");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.id = "departure-error";
    errorDiv.style.color = "red";
    errorDiv.style.fontSize = "0.85rem";
    errorDiv.style.marginTop = "5px";
    departureInput.parentElement.appendChild(errorDiv);
  }

  errorDiv.textContent = errorMessage;

  if (errorMessage) {
    departureInput.style.borderColor = "red";
    return false;
  } else {
    departureInput.style.borderColor = "";
    return true;
  }
}

// ==================== REVERSE GEOCODING ====================
async function getAddressFromCoordinates(lat, lng) {
  if (isNearSLUBakakeng(lat, lng)) {
    return SLU_BAKAKENG.address;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SakayBravo/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    const address = data.address;
    let readableAddress = "";

    if (address.road) {
      readableAddress = address.road;
      if (address.suburb || address.neighbourhood) {
        readableAddress += ", " + (address.suburb || address.neighbourhood);
      }
    } else if (address.suburb || address.neighbourhood) {
      readableAddress = address.suburb || address.neighbourhood;
    }

    if (address.city || address.town || address.village) {
      if (readableAddress) readableAddress += ", ";
      readableAddress += address.city || address.town || address.village;
    }

    if (!readableAddress) {
      readableAddress = data.display_name;
      if (readableAddress.length > 60) {
        readableAddress = readableAddress.substring(0, 60) + "...";
      }
    }

    return readableAddress || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (error) {
    console.error("Geocoding error:", error);
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}
// ==================== LOAD ACTIVE RIDES ====================
async function loadActiveRides() {
  console.log("Loading active rides...");

  try {
    const api = window.api;
    const response = await api.getActiveRides();

    console.log("📊 API Response:", response);

    if (response.success) {
      console.log(`Found ${response.data.length} active ride(s)`);

      if (response.data.length > 0) {
        displayActiveRides(response.data);
      } else {
        displayNoActiveRides();
      }
    } else {
      console.error("API returned success: false");
      displayNoActiveRides();
    }
  } catch (error) {
    console.error("Error loading active rides:", error);
    displayNoActiveRides();
  }
}
function displayNoActiveRides() {
  const tbody = document.querySelector(".rides-information tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
        <div style="font-size: 1.1em; margin-bottom: 10px;">📭 No active rides yet</div>
        <div style="font-size: 0.9em;">Create your first ride to get started!</div>
      </td>
    </tr>
  `;

  const paginationInfo = document.querySelector(".pagination-info");
  if (paginationInfo) {
    paginationInfo.innerHTML = `Showing <strong>0</strong> rides`;
  }
}

// ==================== DISPLAY ACTIVE RIDES ====================
function displayActiveRides(rides) {
  const tbody = document.querySelector(".rides-information tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  rides.forEach((ride) => {
    const row = document.createElement("tr");

    // Parse origin - handle truncated JSON
    let origin = "Unknown location";
    try {
      if (typeof ride.origin === 'string' && ride.origin.trim().startsWith('{')) {
        if (ride.origin.trim().endsWith('}')) {
          const originObj = JSON.parse(ride.origin);
          origin = originObj.address || "Unknown location";
        } else {
          const addressMatch = ride.origin.match(/"address":"([^"]+)/);
          origin = addressMatch ? addressMatch[1] + "..." : "Location data truncated";
        }
      } else if (typeof ride.origin === 'object' && ride.origin !== null) {
        origin = ride.origin.address || "Unknown location";
      } else {
        origin = ride.origin || "Unknown location";
      }
    } catch (e) {
      const addressMatch = ride.origin.match(/"address":"([^"]+)/);
      origin = addressMatch ? addressMatch[1] + "..." : "Error parsing location";
    }

    // Parse destination - handle truncated JSON
    let destination = "Unknown location";
    try {
      if (typeof ride.destination === 'string' && ride.destination.trim().startsWith('{')) {
        if (ride.destination.trim().endsWith('}')) {
          const destObj = JSON.parse(ride.destination);
          destination = destObj.address || "Unknown location";
        } else {
          const addressMatch = ride.destination.match(/"address":"([^"]+)/);
          destination = addressMatch ? addressMatch[1] + "..." : "Location data truncated";
        }
      } else if (typeof ride.destination === 'object' && ride.destination !== null) {
        destination = ride.destination.address || "Unknown location";
      } else {
        destination = ride.destination || "Unknown location";
      }
    } catch (e) {
      const addressMatch = ride.destination.match(/"address":"([^"]+)/);
      destination = addressMatch ? addressMatch[1] + "..." : "Error parsing location";
    }

    // Format departure time
    const departureTime = new Date(ride.departure_time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate available seats
    const bookedSeats = parseInt(ride.booked_seats) || 0;
    const totalSeats = parseInt(ride.total_seats) || 0;
    const availableSeats = totalSeats - bookedSeats;

    // Passenger information
    const totalBookings = parseInt(ride.total_bookings) || 0;
    const passengerInfo = totalBookings > 0
      ? `${totalBookings} passenger${totalBookings > 1 ? "s" : ""} (${bookedSeats} seat${bookedSeats > 1 ? "s" : ""})`
      : "No passengers yet";

    // Status - default to 'posted' if empty
    const rideStatus = ride.status && ride.status.trim() !== '' ? ride.status : 'posted';
    const statusClass = `status-${rideStatus.toLowerCase().replace('_', '-')}`;
    const statusDisplay = rideStatus.replace('_', ' ').toUpperCase();

    row.innerHTML = `
      <td>${passengerInfo}</td>
      <td title="${origin}">${origin.length > 50 ? origin.substring(0, 50) + '...' : origin}</td>
      <td title="${destination}">${destination.length > 50 ? destination.substring(0, 50) + '...' : destination}</td>
      <td><strong>${availableSeats}</strong> / ${totalSeats}</td>
      <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
      <td>${departureTime}</td>
    `;

    tbody.appendChild(row);
  });

  // Update pagination info
  const paginationInfo = document.querySelector(".pagination-info");
  if (paginationInfo) {
    paginationInfo.innerHTML = `
      Showing <strong>1</strong> to <strong>${rides.length}</strong> of
      <strong>${rides.length}</strong> ride${rides.length !== 1 ? "s" : ""}
    `;
  }
}

// ==================== MAIN PAGE MAP ====================
function initializeMainMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  const map = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        map.setView([position.coords.latitude, position.coords.longitude], 15);
        L.marker([position.coords.latitude, position.coords.longitude])
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();
      },
      function (error) {
        console.error("Geolocation error: ", error);
        map.setView([SLU_BAKAKENG.lat, SLU_BAKAKENG.lng], 13);
      }
    );
  } else {
    map.setView([SLU_BAKAKENG.lat, SLU_BAKAKENG.lng], 13);
  }
}

// ==================== CREATE RIDE MAP ====================
function initializeCreateRideMap() {
  if (createRideMap) {
    createRideMap.remove();
  }

  createRideMap = L.map("create-ride-map").setView(
    [SLU_BAKAKENG.lat, SLU_BAKAKENG.lng],
    14
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(createRideMap);

  sluMarker = L.marker([SLU_BAKAKENG.lat, SLU_BAKAKENG.lng], {
    icon: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
  })
    .addTo(createRideMap)
    .bindPopup(`<b>📍 SLU Bakakeng Campus</b><br>${SLU_BAKAKENG.address}`)
    .openPopup();

  createRideMap.on("click", function (e) {
    handleMapClick(e.latlng);
  });

  document.getElementById("map-instruction-text").innerHTML =
    "📍 Click on map to set starting point<br><small style='color: #ffc107;'>Either start or end point must be at SLU Bakakeng</small>";
}

// ==================== MAP CLICK HANDLER ====================
async function handleMapClick(latlng) {
  if (!startPoint) {
    await setStartingPoint(latlng);
  } else if (!endPoint) {
    await setDestination(latlng);
  }
}

// ==================== SET STARTING POINT ====================
async function setStartingPoint(latlng) {
  startPoint = latlng;

  document.getElementById("start-location").textContent = "Loading address...";
  document.getElementById("start-location").className =
    "route-status status-loading";

  if (startMarker) {
    createRideMap.removeLayer(startMarker);
  }

  startMarker = L.marker(latlng, {
    icon: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
  }).addTo(createRideMap);

  startAddress = await getAddressFromCoordinates(latlng.lat, latlng.lng);

  document.getElementById("start-location").textContent = startAddress;
  document.getElementById("start-location").className =
    "route-status status-complete";

  const isSLU = isNearSLUBakakeng(latlng.lat, latlng.lng);
  if (isSLU) {
    document.getElementById("start-location").innerHTML +=
      " <span style='color: #28a745;'>✓ SLU Bakakeng</span>";
  }

  startMarker.bindPopup(`<b>Starting Point</b><br>${startAddress}`).openPopup();

  document.getElementById("map-instruction-text").innerHTML =
    "📍 Click on map to set destination<br>" +
    (isSLU
      ? "<small style='color: #28a745;'>✓ Start point is at SLU - destination can be anywhere within 50km</small>"
      : "<small style='color: #ffc107;'>Destination must be at SLU Bakakeng</small>");
  document.getElementById("clearRouteBtn").style.display = "block";
}

// ==================== SET DESTINATION ====================
async function setDestination(latlng) {
  endPoint = latlng;

  document.getElementById("end-location").textContent = "Loading address...";
  document.getElementById("end-location").className =
    "route-status status-loading";

  if (endMarker) {
    createRideMap.removeLayer(endMarker);
  }

  endMarker = L.marker(latlng, {
    icon: L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
  }).addTo(createRideMap);

  endAddress = await getAddressFromCoordinates(latlng.lat, latlng.lng);

  const startIsSLU = isNearSLUBakakeng(startPoint.lat, startPoint.lng);
  const endIsSLU = isNearSLUBakakeng(latlng.lat, latlng.lng);

  if (!startIsSLU && !endIsSLU) {
    alert(
      "Either the starting point or destination must be at SLU Bakakeng Campus!\n\nPlease select a different point."
    );
    createRideMap.removeLayer(endMarker);
    endMarker = null;
    endPoint = null;
    endAddress = null;
    document.getElementById("end-location").textContent = "Not set";
    document.getElementById("end-location").className =
      "route-status status-waiting";
    return;
  }

  document.getElementById("end-location").textContent = endAddress;
  document.getElementById("end-location").className =
    "route-status status-complete";

  if (endIsSLU) {
    document.getElementById("end-location").innerHTML +=
      " <span style='color: #28a745;'>✓ SLU Bakakeng</span>";
  }

  endMarker.bindPopup(`<b>Destination</b><br>${endAddress}`).openPopup();

  document.getElementById("map-instruction-text").innerHTML =
    "Route complete! Fill in details below<br>" +
    `<small style='color: #28a745;'>✓ ${startIsSLU ? "Starting from" : "Going to"
    } SLU Bakakeng</small>`;

  drawRoute();
  validateForm();
}

// ==================== DRAW ROUTE ====================
function drawRoute() {
  if (routeLine) {
    createRideMap.removeLayer(routeLine);
  }

  routeLine = L.polyline([startPoint, endPoint], {
    color: "#122f40",
    weight: 4,
    opacity: 0.7,
  }).addTo(createRideMap);

  const distance = calculateDistance(startPoint, endPoint);
  document.getElementById("route-distance").textContent =
    distance.toFixed(2) + " km";

  estimatedDurationMinutes = calculateRealisticTravelTime(distance);
  const hours = Math.floor(estimatedDurationMinutes / 60);
  const minutes = estimatedDurationMinutes % 60;

  let durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;
  document.getElementById("route-duration").textContent = durationText;

  createRideMap.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

  updateArrivalTimeDisplay();
}

// ==================== UPDATE ARRIVAL TIME DISPLAY ====================
function updateArrivalTimeDisplay() {
  const departureInput = document.getElementById("departureTime");

  if (
    !departureInput ||
    !departureInput.value ||
    !endPoint ||
    estimatedDurationMinutes === 0
  ) {
    document.getElementById("timeDisplayGrid").style.display = "none";
    return;
  }

  const departureDate = new Date(departureInput.value);
  const arrivalDate = new Date(
    departureDate.getTime() + estimatedDurationMinutes * 60000
  );

  const formatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  document.getElementById("displayDepartureTime").textContent =
    departureDate.toLocaleString("en-US", formatOptions);
  document.getElementById("displayArrivalTime").textContent =
    arrivalDate.toLocaleString("en-US", formatOptions);

  document.getElementById("timeDisplayGrid").style.display = "grid";
}

// ==================== VALIDATE FORM ====================
function validateForm() {
  const departureTime = document.getElementById("departureTime")?.value;
  const availableSeats = document.getElementById("availableSeats")?.value;

  console.log("Form Validation:");
  console.log("  Start Point:", startPoint ? "✓" : "✗");
  console.log("  End Point:", endPoint ? "✓" : "✗");
  console.log("  Departure Time:", departureTime ? "✓" : "✗");
  console.log("  Seats:", availableSeats ? "✓" : "✗");

  const departureValid = departureTime ? validateDepartureTime() : false;
  console.log("  Departure Valid:", departureValid ? "✓" : "✗");

  const isValid =
    startPoint &&
    endPoint &&
    departureTime &&
    availableSeats &&
    departureValid;

  console.log("  Overall:", isValid ? "VALID" : "INVALID");

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? "1" : "0.6";
    submitBtn.style.cursor = isValid ? "pointer" : "not-allowed";
  }
}

// ==================== CLEAR ROUTE ====================
function clearRoute() {
  if (startMarker) createRideMap.removeLayer(startMarker);
  if (endMarker) createRideMap.removeLayer(endMarker);
  if (routeLine) createRideMap.removeLayer(routeLine);

  startPoint = null;
  endPoint = null;
  startAddress = null;
  endAddress = null;
  startMarker = null;
  endMarker = null;
  routeLine = null;
  estimatedDurationMinutes = 0;

  document.getElementById("start-location").textContent = "Not set";
  document.getElementById("start-location").className =
    "route-status status-waiting";
  document.getElementById("end-location").textContent = "Not set";
  document.getElementById("end-location").className =
    "route-status status-waiting";
  document.getElementById("route-distance").textContent = "--";
  document.getElementById("route-duration").textContent = "--";
  document.getElementById("map-instruction-text").innerHTML =
    "📍 Click on map to set starting point<br><small style='color: #ffc107;'>Either start or end point must be at SLU Bakakeng</small>";
  document.getElementById("clearRouteBtn").style.display = "none";
  document.getElementById("timeDisplayGrid").style.display = "none";
  document.getElementById("submitBtn").disabled = true;

  const errorDiv = document.getElementById("departure-error");
  if (errorDiv) {
    errorDiv.textContent = "";
  }
}

// ==================== OPEN/CLOSE POPUP ====================
function openCreateRidePopup() {
  document.getElementById("create-ride-popup").classList.add("active");

  // Dynamically populate seats based on vehicle capacity (max 4)
  const seatsSelect = document.getElementById("availableSeats");
  seatsSelect.innerHTML = '<option value="">Select seats</option>';

  // Ensure maxSeats doesn't exceed 4 (standard car capacity)
  const actualMaxSeats = Math.min(maxSeats, 4);

  for (let i = 1; i <= actualMaxSeats; i++) {
    seatsSelect.innerHTML += `<option value="${i}">${i} seat${i > 1 ? "s" : ""
      }</option>`;
  }

  console.log(`Seats dropdown populated: 1-${actualMaxSeats} seats`);

  const departureInput = document.getElementById("departureTime");
  const now = new Date();
  const minTime = new Date(now.getTime() + 30 * 60000);
  departureInput.min = formatDateTimeLocal(minTime);
  const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60000);
  departureInput.max = formatDateTimeLocal(maxTime);

  departureInput.addEventListener("change", function () {
    updateArrivalTimeDisplay();
    validateForm();
  });

  seatsSelect.addEventListener("change", validateForm);

  setTimeout(() => {
    initializeCreateRideMap();
  }, 100);
}

function closeCreateRidePopup() {
  document.getElementById("create-ride-popup").classList.remove("active");
  clearRoute();
  document.getElementById("createRideForm").reset();
  document.getElementById("timeDisplayGrid").style.display = "none";

  const errorDiv = document.getElementById("departure-error");
  if (errorDiv) {
    errorDiv.textContent = "";
  }

  if (createRideMap) {
    createRideMap.remove();
    createRideMap = null;
  }
}

// ==================== SUBMIT CREATE RIDE ====================
async function submitCreateRide() {
  if (!startPoint || !endPoint) {
    alert("Please set both starting point and destination on the map!");
    return;
  }

  if (!validateDepartureTime()) {
    alert("Please select a valid departure time!");
    return;
  }

  const departureTime = document.getElementById("departureTime").value;
  const availableSeats = document.getElementById("availableSeats").value;

  if (!departureTime || !availableSeats) {
    alert("Please fill in all required fields!");
    return;
  }

  const departureDate = new Date(departureTime);
  const arrivalDate = new Date(
    departureDate.getTime() + estimatedDurationMinutes * 60000
  );

  const rideData = {
    startPoint: {
      lat: startPoint.lat,
      lng: startPoint.lng,
      address: startAddress,
    },
    endPoint: {
      lat: endPoint.lat,
      lng: endPoint.lng,
      address: endAddress,
    },
    departureTime: departureDate.toISOString(),
    estimatedArrivalTime: arrivalDate.toISOString(),
    estimatedDurationMinutes: estimatedDurationMinutes,
    availableSeats: parseInt(availableSeats),
    distance: calculateDistance(startPoint, endPoint).toFixed(2),
  };

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "CREATING...";

  try {
    const api = window.api;
    const response = await api.createRide(rideData);

    console.log("Ride creation response:", response);

    if (response.success) {
      alert("Ride created successfully!");
      closeCreateRidePopup();

      // Wait a moment for the database to update
      setTimeout(() => {
        console.log("Reloading active rides...");
        loadActiveRides();
      }, 500);
    } else {
      alert("Failed to create ride: " + (response.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Error creating ride:", error);
    alert("An error occurred: " + (error.message || "Please try again"));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "CREATE RIDE";
  }
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const popup = document.getElementById("create-ride-popup");
    if (popup && popup.classList.contains("active")) {
      closeCreateRidePopup();
    }
  }
});

// ==================== MISSING HELPER FUNCTIONS ====================
// Add these functions to your create_ride.js file

// ==================== LOGOUT HANDLER ====================
function setupLogoutHandler() {
  const api = window.api;
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await api.logout();
        localStorage.removeItem("auth_token");
        window.location.href = "/auth.php";
      } catch (error) {
        console.error("Logout error:", error);
        // Even if logout fails, redirect to login
        localStorage.removeItem("auth_token");
        window.location.href = "/auth.php";
      }
    });
  }
}

// ==================== PROFILE DROPDOWN ====================
function setupProfileDropdown() {
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileBtn && profileDropdown) {
    // Toggle dropdown when clicking profile button
    profileBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !profileBtn.contains(e.target) &&
        !profileDropdown.contains(e.target)
      ) {
        profileDropdown.classList.remove("show");
      }
    });

    // Close dropdown when pressing Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        profileDropdown.classList.remove("show");
      }
    });
  }
}

// ==================== HANDLE PROFILE PICTURE ERRORS ====================
// Add error handling for missing profile pictures
function handleProfilePictureError(imgElement) {
  imgElement.onerror = function () {
    this.src = '/views/assets/Profile Icon.png';
    this.onerror = null; // Prevent infinite loop
  };
}