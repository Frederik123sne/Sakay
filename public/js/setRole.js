// ========================================
// STATE MANAGEMENT
// ========================================
let selectedRole = null;
let currentStage = 1;
let licenseImageData = null;
let vehiclePhotoData = null;
let driverPhotoData = null;
let passengerPhotoData = null;
let orcrImageData = null;

// Vehicle brands and models data
const vehicleData = {
  Toyota: [
    "Vios",
    "Corolla",
    "Camry",
    "Innova",
    "Fortuner",
    "Wigo",
    "Rush",
    "Avanza",
    "Hilux",
    "RAV4",
  ],
  Honda: ["City", "Civic", "Accord", "CR-V", "BR-V", "Jazz", "HR-V", "Odyssey"],
  Mitsubishi: [
    "Mirage",
    "Lancer",
    "Montero Sport",
    "Pajero",
    "Adventure",
    "L300",
    "Xpander",
    "Strada",
  ],
  Nissan: ["Almera", "Sylphy", "Navara", "Terra", "X-Trail", "Patrol", "Urvan"],
  Hyundai: [
    "Accent",
    "Elantra",
    "Tucson",
    "Santa Fe",
    "Stargazer",
    "Kona",
    "Reina",
  ],
  Mazda: ["2", "3", "6", "CX-3", "CX-5", "CX-9", "BT-50"],
  Ford: [
    "Fiesta",
    "Focus",
    "Mustang",
    "EcoSport",
    "Territory",
    "Everest",
    "Ranger",
  ],
  Suzuki: ["Swift", "Celerio", "Dzire", "Ertiga", "Vitara", "Jimny", "APV"],
  Isuzu: ["D-Max", "mu-X"],
  Chevrolet: ["Spark", "Sail", "Trailblazer", "Colorado"],
};

// ========================================
// DOM ELEMENTS
// ========================================
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const formHeading = document.getElementById("formHeading");
const formSubheading = document.getElementById("formSubheading");
const errorMessage = document.getElementById("errorMessage");
const registrationForm = document.getElementById("registrationForm");

// Stage elements
const stage1 = document.getElementById("stage1");
const stage2Driver = document.getElementById("stage2Driver");
const stage3Driver = document.getElementById("stage3Driver");
const stage4Vehicle = document.getElementById("stage4Vehicle");
const stage5DriverPhoto = document.getElementById("stage5DriverPhoto");
const stage2Passenger = document.getElementById("stage2Passenger");
const stage3Passenger = document.getElementById("stage3Passenger");
const stageFinal = document.getElementById("stageFinal");

// ========================================
// UTILITY FUNCTIONS
// ========================================
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 5000);
}

function updateProgress() {
  const totalStages = selectedRole === "driver" ? 6 : 4;
  const percentage = (currentStage / totalStages) * 100;
  progressFill.style.width = percentage + "%";
}

function showStage(stageElement) {
  document.querySelectorAll(".form-stage").forEach((stage) => {
    stage.classList.remove("active");
  });
  stageElement.classList.add("active");
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Validate Philippine license number format
function validateLicenseNumber(licenseNumber) {
  const pattern = /^[A-Z]\d{2}-\d{2}-\d{6}$/;
  return pattern.test(licenseNumber);
}

// Validate plate number format
function validatePlateNumber(plateNumber) {
  const pattern = /^[A-Z0-9]{2,3}-[A-Z0-9]{3,4}$/i;
  return pattern.test(plateNumber);
}

// Format license number as user types
function formatLicenseNumber(value) {
  // Remove all non-alphanumeric characters
  let cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  // Apply format: A00-00-000000
  let formatted = "";
  if (cleaned.length > 0) {
    formatted += cleaned.substring(0, 1); // Letter
  }
  if (cleaned.length > 1) {
    formatted += cleaned.substring(1, 3); // First 2 digits
  }
  if (cleaned.length > 3) {
    formatted += "-" + cleaned.substring(3, 5); // Next 2 digits
  }
  if (cleaned.length > 5) {
    formatted += "-" + cleaned.substring(5, 11); // Last 6 digits
  }

  return formatted;
}

// ========================================
// STAGE 1: ROLE SELECTION
// ========================================
document.querySelectorAll(".role-card").forEach((card) => {
  card.addEventListener("click", function () {
    document
      .querySelectorAll(".role-card")
      .forEach((c) => c.classList.remove("selected"));
    this.classList.add("selected");
    selectedRole = this.dataset.role;
    document.getElementById("nextBtn").disabled = false;
  });
});

document.getElementById("nextBtn").addEventListener("click", function () {
  if (!selectedRole) {
    showError("Please select a role");
    return;
  }

  currentStage = 2;
  formHeading.textContent =
    selectedRole === "driver" ? "Driver License Details" : "Payment Method";
  formSubheading.textContent =
    selectedRole === "driver"
      ? "Enter your driver's license information"
      : "Select your preferred payment method";

  if (selectedRole === "driver") {
    showStage(stage2Driver);
  } else {
    showStage(stage2Passenger);
  }
});

// ========================================
// DRIVER STAGE 2: LICENSE DETAILS
// ========================================
const licenseNumberInput = document.getElementById("licenseNumber");
const licenseTypeSelect = document.getElementById("licenseType");
const licenseExpiryInput = document.getElementById("licenseExpiry");

// Format license number as user types
licenseNumberInput.addEventListener("input", function (e) {
  const cursorPosition = e.target.selectionStart;
  const oldValue = e.target.value;
  const newValue = formatLicenseNumber(e.target.value);

  e.target.value = newValue;

  // Adjust cursor position
  const diff = newValue.length - oldValue.length;
  e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
});

// Set minimum date to today for license expiry
const today = new Date().toISOString().split("T")[0];
licenseExpiryInput.setAttribute("min", today);

document
  .getElementById("backBtnDriver2")
  .addEventListener("click", function () {
    currentStage = 1;
    formHeading.textContent = "Choose Your Role";
    formSubheading.textContent =
      "Select whether you want to register as a driver or passenger";
    showStage(stage1);
  });

document
  .getElementById("nextBtnDriver2")
  .addEventListener("click", function () {
    const licenseNumber = licenseNumberInput.value.trim();
    const licenseType = licenseTypeSelect.value;
    const licenseExpiry = licenseExpiryInput.value;

    if (!licenseNumber || !licenseType || !licenseExpiry) {
      showError("Please fill in all license details");
      return;
    }

    if (!validateLicenseNumber(licenseNumber)) {
      showError(
        "Invalid license format. Use: A00-00-000000 (e.g., N01-12-123456)"
      );
      licenseNumberInput.focus();
      return;
    }

    if (licenseType !== "Professional") {
      showError("Only professional licenses are accepted");
      licenseTypeSelect.focus();
      return;
    }

    const expiryDate = new Date(licenseExpiry);
    if (expiryDate <= new Date()) {
      showError("License expiry date must be in the future");
      licenseExpiryInput.focus();
      return;
    }

    currentStage = 3;
    formHeading.textContent = "Upload License Image";
    formSubheading.textContent =
      "Upload a clear photo of your driver's license";
    showStage(stage3Driver);
  });

// ========================================
// DRIVER STAGE 3: LICENSE IMAGE
// ========================================
const licenseFileInput = document.getElementById("licenseFileInput");
const licensePreview = document.getElementById("licensePreview");
const uploadLicenseBtn = document.getElementById("uploadLicenseBtn");
const removeLicenseBtn = document.getElementById("removeLicenseBtn");
const nextBtnDriver3 = document.getElementById("nextBtnDriver3");

uploadLicenseBtn.addEventListener("click", () => licenseFileInput.click());

licenseFileInput.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please upload an image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError("Image size must be less than 5MB");
    return;
  }

  try {
    licenseImageData = await fileToBase64(file);
    licensePreview.innerHTML = `<img src="${licenseImageData}" alt="License" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    removeLicenseBtn.style.display = "inline-block";
    nextBtnDriver3.disabled = false;
  } catch (error) {
    showError("Failed to process image");
    console.error(error);
  }
});

removeLicenseBtn.addEventListener("click", function () {
  licenseImageData = null;
  licensePreview.innerHTML = `
    <div class="license-placeholder">
      <div class="icon"></div>
      <p>Upload your driver's license</p>
      <p style="font-size: 12px; margin-top: 5px;">Required for verification</p>
    </div>
  `;
  licenseFileInput.value = "";
  this.style.display = "none";
  nextBtnDriver3.disabled = true;
});

document
  .getElementById("backBtnDriver3")
  .addEventListener("click", function () {
    currentStage = 2;
    formHeading.textContent = "Driver License Details";
    formSubheading.textContent = "Enter your driver's license information";
    showStage(stage2Driver);
  });

document
  .getElementById("nextBtnDriver3")
  .addEventListener("click", function () {
    if (!licenseImageData) {
      showError("Please upload your license image");
      return;
    }

    currentStage = 4;
    formHeading.textContent = "Vehicle Information";
    formSubheading.textContent = "Enter your vehicle details";
    showStage(stage4Vehicle);
    initializeVehicleDropdowns();
  });

// ========================================
// DRIVER STAGE 4: VEHICLE INFORMATION
// ========================================
const vehicleBrandSelect = document.getElementById("vehicleBrand");
const vehicleModelSelect = document.getElementById("vehicleModel");
const vehicleColorInput = document.getElementById("vehicleColor");
const vehicleYearSelect = document.getElementById("vehicleYear");
const plateNumberInput = document.getElementById("plateNumber");
const seatsAvailableSelect = document.getElementById("seatsAvailable");
const orcrFileInput = document.getElementById("orcrFileInput");
const orcrPreview = document.getElementById("orcrPreview");
const uploadOrcrBtn = document.getElementById("uploadOrcrBtn");
const removeOrcrBtn = document.getElementById("removeOrcrBtn");
const nextBtnVehicle = document.getElementById("nextBtnVehicle");

function initializeVehicleDropdowns() {
  // Populate brands
  vehicleBrandSelect.innerHTML = '<option value="">Select brand</option>';
  Object.keys(vehicleData)
    .sort()
    .forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      vehicleBrandSelect.appendChild(option);
    });

  // Populate years (current year to 20 years ago)
  vehicleYearSelect.innerHTML = '<option value="">Select year</option>';
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 20; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    vehicleYearSelect.appendChild(option);
  }

  // Populate seats
  seatsAvailableSelect.innerHTML = '<option value="">Select seats</option>';
  for (let i = 1; i <= 7; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i + (i === 1 ? " seat" : " seats");
    seatsAvailableSelect.appendChild(option);
  }
}

vehicleBrandSelect.addEventListener("change", function () {
  const brand = this.value;
  vehicleModelSelect.innerHTML = '<option value="">Select model</option>';

  if (brand && vehicleData[brand]) {
    vehicleModelSelect.disabled = false;
    vehicleData[brand].forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      vehicleModelSelect.appendChild(option);
    });
  } else {
    vehicleModelSelect.disabled = true;
  }
});

plateNumberInput.addEventListener("input", function (e) {
  e.target.value = e.target.value.toUpperCase();
});

// OR/CR Image Upload
uploadOrcrBtn.addEventListener("click", () => orcrFileInput.click());

orcrFileInput.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please upload an image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError("Image size must be less than 5MB");
    return;
  }

  try {
    orcrImageData = await fileToBase64(file);
    orcrPreview.innerHTML = `<img src="${orcrImageData}" alt="OR/CR" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    orcrPreview.classList.remove("empty");
    removeOrcrBtn.style.display = "inline-block";
    checkVehicleFormComplete();
  } catch (error) {
    showError("Failed to process image");
    console.error(error);
  }
});

removeOrcrBtn.addEventListener("click", function () {
  orcrImageData = null;
  orcrPreview.innerHTML = '<div class="photo-placeholder"></div>';
  orcrPreview.classList.add("empty");
  orcrFileInput.value = "";
  this.style.display = "none";
  checkVehicleFormComplete();
});

function checkVehicleFormComplete() {
  const allFieldsFilled =
    vehicleBrandSelect.value &&
    vehicleModelSelect.value &&
    vehicleColorInput.value.trim() &&
    vehicleYearSelect.value &&
    plateNumberInput.value.trim() &&
    seatsAvailableSelect.value &&
    orcrImageData;

  nextBtnVehicle.disabled = !allFieldsFilled;
}

[
  vehicleBrandSelect,
  vehicleModelSelect,
  vehicleColorInput,
  vehicleYearSelect,
  plateNumberInput,
  seatsAvailableSelect,
].forEach((input) => {
  input.addEventListener("input", checkVehicleFormComplete);
  input.addEventListener("change", checkVehicleFormComplete);
});

document
  .getElementById("backBtnVehicle")
  .addEventListener("click", function () {
    currentStage = 3;
    formHeading.textContent = "Upload License Image";
    formSubheading.textContent =
      "Upload a clear photo of your driver's license";
    showStage(stage3Driver);
  });

document
  .getElementById("nextBtnVehicle")
  .addEventListener("click", function () {
    const plateNumber = plateNumberInput.value.trim();

    if (!validatePlateNumber(plateNumber)) {
      showError("Invalid plate format. Use: ABC-1234 or AB-1234");
      plateNumberInput.focus();
      return;
    }

    if (!orcrImageData) {
      showError("Please upload your vehicle's OR/CR");
      return;
    }

    currentStage = 5;
    formHeading.textContent = "Profile Photo";
    formSubheading.textContent = "Upload your profile photo";
    showStage(stage5DriverPhoto);
  });

// ========================================
// DRIVER STAGE 5: PROFILE PHOTO
// ========================================
const driverPhotoFileInput = document.getElementById("driverPhotoFileInput");
const driverPhotoPreview = document.getElementById("driverPhotoPreview");
const uploadDriverPhotoBtn = document.getElementById("uploadDriverPhotoBtn");
const removeDriverPhotoBtn = document.getElementById("removeDriverPhotoBtn");
const submitDriverBtn = document.getElementById("submitDriverBtn");

uploadDriverPhotoBtn.addEventListener("click", () =>
  driverPhotoFileInput.click()
);

driverPhotoFileInput.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please upload an image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError("Image size must be less than 5MB");
    return;
  }

  try {
    driverPhotoData = await fileToBase64(file);
    driverPhotoPreview.innerHTML = `<img src="${driverPhotoData}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    driverPhotoPreview.classList.remove("empty");
    removeDriverPhotoBtn.style.display = "inline-block";
    submitDriverBtn.disabled = false;
  } catch (error) {
    showError("Failed to process image");
    console.error(error);
  }
});

removeDriverPhotoBtn.addEventListener("click", function () {
  driverPhotoData = null;
  driverPhotoPreview.innerHTML = '<div class="photo-placeholder">👤</div>';
  driverPhotoPreview.classList.add("empty");
  driverPhotoFileInput.value = "";
  this.style.display = "none";
  submitDriverBtn.disabled = true;
});

document
  .getElementById("backBtnDriver4")
  .addEventListener("click", function () {
    currentStage = 4;
    formHeading.textContent = "Vehicle Information";
    formSubheading.textContent = "Enter your vehicle details";
    showStage(stage4Vehicle);
  });

// ========================================
// PASSENGER STAGE 2: PAYMENT METHOD
// ========================================
document
  .getElementById("backBtnPassenger2")
  .addEventListener("click", function () {
    currentStage = 1;
    formHeading.textContent = "Choose Your Role";
    formSubheading.textContent =
      "Select whether you want to register as a driver or passenger";
    showStage(stage1);
  });

document
  .getElementById("nextBtnPassenger2")
  .addEventListener("click", function () {
    currentStage = 3;
    formHeading.textContent = "Profile Photo";
    formSubheading.textContent = "Upload your profile photo";
    showStage(stage3Passenger);
  });

// ========================================
// PASSENGER STAGE 3: PROFILE PHOTO
// ========================================
const passengerPhotoFileInput = document.getElementById(
  "passengerPhotoFileInput"
);
const passengerPhotoPreview = document.getElementById("passengerPhotoPreview");
const uploadPassengerPhotoBtn = document.getElementById(
  "uploadPassengerPhotoBtn"
);
const removePassengerPhotoBtn = document.getElementById(
  "removePassengerPhotoBtn"
);
const submitPassengerBtn = document.getElementById("submitPassengerBtn");

uploadPassengerPhotoBtn.addEventListener("click", () =>
  passengerPhotoFileInput.click()
);

passengerPhotoFileInput.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please upload an image file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError("Image size must be less than 5MB");
    return;
  }

  try {
    passengerPhotoData = await fileToBase64(file);
    passengerPhotoPreview.innerHTML = `<img src="${passengerPhotoData}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    passengerPhotoPreview.classList.remove("empty");
    removePassengerPhotoBtn.style.display = "inline-block";
    submitPassengerBtn.disabled = false;
  } catch (error) {
    showError("Failed to process image");
    console.error(error);
  }
});

removePassengerPhotoBtn.addEventListener("click", function () {
  passengerPhotoData = null;
  passengerPhotoPreview.innerHTML = '<div class="photo-placeholder">👤</div>';
  passengerPhotoPreview.classList.add("empty");
  passengerPhotoFileInput.value = "";
  this.style.display = "none";
  submitPassengerBtn.disabled = true;
});

document
  .getElementById("backBtnPassenger3")
  .addEventListener("click", function () {
    currentStage = 2;
    formHeading.textContent = "Payment Method";
    formSubheading.textContent = "Select your preferred payment method";
    showStage(stage2Passenger);
  });

// ========================================
// FORM SUBMISSION
// ========================================
registrationForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitButton =
    selectedRole === "driver" ? submitDriverBtn : submitPassengerBtn;
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    // Build the request payload
    const formData = {
      role: selectedRole,
    };

    if (selectedRole === "driver") {
      formData.license_number = licenseNumberInput.value.trim();
      formData.license_type = licenseTypeSelect.value;
      formData.license_expiry = licenseExpiryInput.value;
      formData.vehicle_brand = vehicleBrandSelect.value;
      formData.vehicle_model = vehicleModelSelect.value;
      formData.vehicle_color = vehicleColorInput.value.trim();
      formData.vehicle_year = vehicleYearSelect.value;
      formData.plate_number = plateNumberInput.value.trim().toUpperCase();
      formData.seats_available = seatsAvailableSelect.value;
      formData.license_image = licenseImageData;
      formData.vehicle_photo = orcrImageData;
      formData.profile_photo = driverPhotoData;
    } else {
      formData.preferred_payment =
        document.getElementById("preferredPayment").value;
      formData.profile_photo = passengerPhotoData;
    }

    // Send POST request using fetch
    const response = await fetch("routes/role.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    // Parse JSON response
    const data = await response.json();

    // Handle response based on success status
    if (data.success) {
      // Success - Show completion stage
      currentStage = selectedRole === "driver" ? 6 : 4;
      formHeading.textContent = "Registration Complete!";
      formSubheading.textContent = "";
      progressFill.style.width = "100%";

      // Display summary
      displaySummary(data.data);
      showStage(stageFinal);

      // Setup dashboard button
      document
        .getElementById("goToDashboardBtn")
        .addEventListener("click", function () {
          window.location.href = data.data.dashboardPath;
        });
    } else {
      // Error - Show error message
      const errorMsg = data.message || "Registration failed. Please try again.";

      // If there are specific field errors, display them
      if (data.errors && Array.isArray(data.errors)) {
        showError(data.errors.join(", "));
      } else if (data.errors && typeof data.errors === "object") {
        const errorMessages = Object.values(data.errors).flat();
        showError(errorMessages.join(", "));
      } else {
        showError(errorMsg);
      }

      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  } catch (error) {
    console.error("Submission error:", error);

    // Handle network or parsing errors
    showError(
      "Failed to submit registration. Please check your connection and try again."
    );
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});

// ========================================
// SUCCESS SUMMARY DISPLAY
// ========================================
function displaySummary(data) {
  const summaryContainer = document.getElementById("summaryContainer");
  let summaryHTML =
    '<div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">';

  summaryHTML += `<h4 style="margin-bottom: 1rem; color: #333;">Registration Details</h4>`;
  summaryHTML += `<p><strong>Role:</strong> ${data.role.charAt(0).toUpperCase() + data.role.slice(1)
    }</p>`;
  summaryHTML += `<p><strong>User ID:</strong> ${data.userID}</p>`;

  if (data.role === "driver") {
    summaryHTML += `
      <p><strong>License Number:</strong> ${licenseNumberInput.value}</p>
      <p><strong>Vehicle:</strong> ${vehicleBrandSelect.value} ${vehicleModelSelect.value
      }</p>
      <p><strong>Plate Number:</strong> ${plateNumberInput.value.toUpperCase()}</p>
      <p style="margin-top: 1rem; color: #666; font-size: 14px;">
        Your driver account is pending verification. You'll be notified once approved.
      </p>
    `;
  } else {
    summaryHTML += `
      <p><strong>Payment Method:</strong> ${document
        .getElementById("preferredPayment")
        .value.toUpperCase()}</p>
      <p style="margin-top: 1rem; color: #4caf50; font-size: 14px;">
        Your passenger account is ready to use!
      </p>
    `;
  }

  summaryHTML += "</div>";
  summaryContainer.innerHTML = summaryHTML;
}

// ========================================
// INITIALIZE
// ========================================
console.log("setRole.js loaded successfully");
