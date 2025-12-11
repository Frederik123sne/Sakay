// DOM Elements
const formHeading = document.getElementById("formHeading");
const toggleText = document.getElementById("toggleText");
const submitButton = document.getElementById("submitButton");
const forgotPassword = document.getElementById("forgotPassword");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");

// Mode Detection
let isSignIn = true;

// Create Error Box
let errorBox = document.createElement("div");
errorBox.id = "errorBox";
errorBox.style.cssText = `
  color: #d32f2f;
  background: #ffebee;
  padding: 0.75rem;
  border-radius: 10px;
  text-align: center;
  margin: 0.5rem 0;
  display: none;
  font-size: 0.9rem;
  border: 1px solid #ef5350;
`;
authForm.insertBefore(errorBox, authForm.firstChild);

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  setTimeout(() => {
    errorBox.style.display = "none";
  }, 5000);
}

// Add Email Validation Hint (will be inserted after email input in proper position later)
const emailHint = document.createElement("small");
emailHint.id = "emailHint";
emailHint.style.cssText = `
  display: block;
  margin-top: 0.25rem;
  margin-left: 0.5rem;
  color: #666;
  font-size: 0.9rem;
`;
emailHint.textContent = "Please use your SLU email address (@slu.edu.ph)";

// ========== VALIDATION FUNCTIONS ==========

// Validate Name (only letters, spaces, hyphens, and apostrophes)
function isValidName(name) {
  // Allows letters (including accented), spaces, hyphens, and apostrophes
  // Minimum 2 characters, maximum 50 characters
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;

  // Check basic format
  if (!nameRegex.test(name)) {
    return false;
  }

  // Ensure name doesn't start or end with space/hyphen/apostrophe
  if (/^[\s'-]|[\s'-]$/.test(name)) {
    return false;
  }

  // Ensure no consecutive spaces, hyphens, or apostrophes
  if (/[\s'-]{2,}/.test(name)) {
    return false;
  }

  return true;
}

// Validate Philippine Phone Number (Enhanced)
function isValidPhilippinePhone(phone) {
  // Remove all spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Philippine phone number formats:
  // Mobile: 09XXXXXXXXX (11 digits starting with 09)
  // Mobile with +63: +639XXXXXXXXX or 639XXXXXXXXX (13 or 12 characters)

  const patterns = [
    /^09\d{9}$/,        // 09171234567 (11 digits)
    /^\+639\d{9}$/,     // +639171234567 (13 chars)
    /^639\d{9}$/,       // 639171234567 (12 digits)
  ];

  return patterns.some((pattern) => pattern.test(cleanPhone));
}

// Normalize Phone Number (for backend submission)
function normalizePhoneNumber(phone) {
  // Remove all formatting characters
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Convert to standard 09 format
  if (cleanPhone.startsWith("+639")) {
    return "0" + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith("639")) {
    return "0" + cleanPhone.substring(2);
  }

  return cleanPhone;
}

// Format phone number display (for user feedback)
function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Format mobile numbers
  if (cleanPhone.startsWith("09") && cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  // Format with +63
  if (cleanPhone.startsWith("+639") || cleanPhone.startsWith("639")) {
    const normalized = cleanPhone.replace(/^\+?63/, "0");
    return normalized.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  return phone;
}

// Validate SLU Email
function isValidSLUEmail(email) {
  return /^[a-zA-Z0-9._-]+@slu\.edu\.ph$/i.test(email);
}

// Validate Password Strength
function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const strength = Object.values(requirements).filter(Boolean).length;

  return {
    requirements,
    strength,
    isStrong: strength >= 5 && requirements.length, // All 5 requirements must be met
  };
}

// Create Password Strength Indicator
function createPasswordStrengthIndicator() {
  const indicator = document.createElement("div");
  indicator.id = "passwordStrength";
  indicator.style.cssText = `
    margin-top: 0.5rem;
    padding: 0.5rem;
    border-radius: 8px;
    font-size: 0.85rem;
    display: none;
  `;
  return indicator;
}

// Update Password Strength Indicator
function updatePasswordStrengthIndicator(password, indicator) {
  if (!password) {
    indicator.style.display = "none";
    return;
  }

  const validation = validatePasswordStrength(password);
  indicator.style.display = "block";

  let message = "<strong>Password Requirements:</strong><br>";
  message += `${validation.requirements.length ? "✓" : "✗"} At least 8 characters<br>`;
  message += `${validation.requirements.uppercase ? "✓" : "✗"} One uppercase letter<br>`;
  message += `${validation.requirements.lowercase ? "✓" : "✗"} One lowercase letter<br>`;
  message += `${validation.requirements.number ? "✓" : "✗"} One number<br>`;
  message += `${validation.requirements.special ? "✓" : "✗"} One special character`;

  indicator.innerHTML = message;

  // Color coding
  if (validation.strength <= 2) {
    indicator.style.backgroundColor = "#ffebee";
    indicator.style.color = "#c62828";
    indicator.style.border = "1px solid #ef5350";
  } else if (validation.strength <= 4) {
    indicator.style.backgroundColor = "#fff3e0";
    indicator.style.color = "#ef6c00";
    indicator.style.border = "1px solid #ff9800";
  } else {
    indicator.style.backgroundColor = "#e8f5e9";
    indicator.style.color = "#2e7d32";
    indicator.style.border = "1px solid #4caf50";
  }
}

// Create Password Field with Toggle
function createPasswordField(id, placeholder) {
  const container = document.createElement("div");
  container.className = "password-container";
  container.style.cssText = "position: relative; margin-bottom: 0.5rem;";

  const inputWrapper = document.createElement("div");
  inputWrapper.style.position = "relative";

  const input = document.createElement("input");
  input.className = "input";
  input.type = "password";
  input.id = id;
  input.name = id;
  input.placeholder = placeholder;
  input.required = true;

  const toggle = document.createElement("span");
  toggle.className = "toggle-password";
  toggle.dataset.target = id;
  toggle.textContent = "🔒";
  toggle.style.cssText =
    "position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; z-index: 10;";

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(toggle);
  container.appendChild(inputWrapper);

  // Add strength indicator for main password (outside the input wrapper)
  if (id === "password") {
    const strengthIndicator = createPasswordStrengthIndicator();
    container.appendChild(strengthIndicator);

    input.addEventListener("input", (e) => {
      if (!isSignIn) {
        updatePasswordStrengthIndicator(e.target.value, strengthIndicator);
      }
    });
  }

  return container;
}

// Create Phone Hint Element
const phoneHint = document.createElement("small");
phoneHint.id = "phoneHint";
phoneHint.style.cssText = `
  display: block;
  margin-top: 0.25rem;
  margin-left: 0.5rem;
  color: #666;
  font-size: 0.85rem;
`;
phoneHint.textContent = "e.g., 09171234567 or +639171234567";

// Create Sign Up Fields with Validation Hints
const signUpFieldsContainer = document.createElement("div");
signUpFieldsContainer.id = "signUpFieldsContainer";
signUpFieldsContainer.style.display = "none";

// First Name Field
const firstNameInput = document.createElement("input");
firstNameInput.className = "input";
firstNameInput.type = "text";
firstNameInput.name = "first_name";
firstNameInput.id = "first_name";
firstNameInput.placeholder = "First Name";
firstNameInput.required = false;

// Last Name Field
const lastNameInput = document.createElement("input");
lastNameInput.className = "input";
lastNameInput.type = "text";
lastNameInput.name = "last_name";
lastNameInput.id = "last_name";
lastNameInput.placeholder = "Last Name";
lastNameInput.required = false;

// Phone Field Container
const phoneFieldContainer = document.createElement("div");
phoneFieldContainer.style.cssText = "margin-bottom: 0.5rem;";

const phoneInput = document.createElement("input");
phoneInput.className = "input";
phoneInput.type = "tel";
phoneInput.name = "phone";
phoneInput.id = "phone";
phoneInput.placeholder = "Phone Number";
phoneInput.required = false;

phoneFieldContainer.appendChild(phoneInput);
phoneFieldContainer.appendChild(phoneHint);

signUpFieldsContainer.appendChild(firstNameInput);
signUpFieldsContainer.appendChild(lastNameInput);
signUpFieldsContainer.appendChild(phoneFieldContainer);

// Create password containers
const passwordContainer = createPasswordField("password", "Password");
const confirmPasswordContainer = createPasswordField(
  "confirmPassword",
  "Confirm Password"
);

// Insert sign up fields before email
authForm.insertBefore(signUpFieldsContainer, emailInput);

// Insert email hint right after email input
emailInput.parentNode.insertBefore(emailHint, emailInput.nextSibling);

// Insert password fields after email hint
emailHint.parentNode.insertBefore(passwordContainer, emailHint.nextSibling);
emailHint.parentNode.insertBefore(
  confirmPasswordContainer,
  passwordContainer.nextSibling
);

// Initially hide confirm password
confirmPasswordContainer.style.display = "none";

// ========== REAL-TIME VALIDATION FOR NAMES ==========

// First Name Validation
firstNameInput.addEventListener("input", (e) => {
  // Remove any non-letter characters except spaces, hyphens, and apostrophes
  e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
});

// Last Name Validation
lastNameInput.addEventListener("input", (e) => {
  // Remove any non-letter characters except spaces, hyphens, and apostrophes
  e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
});

// ========== REAL-TIME VALIDATION FOR PHONE ==========

phoneInput.addEventListener("input", (e) => {
  // Allow only numbers, spaces, dashes, parentheses, and plus sign
  e.target.value = e.target.value.replace(/[^\d\s\-()+]/g, "");
});

phoneInput.addEventListener("blur", (e) => {
  const phone = e.target.value.trim();
  if (phone && !isValidPhilippinePhone(phone)) {
    phoneHint.style.color = "#d32f2f";
    phoneHint.textContent = "⚠ Please enter a valid Philippine phone number";
    phoneInput.style.borderColor = "#d32f2f";
  } else if (phone) {
    phoneHint.style.color = "#2e7d32";
    phoneHint.textContent = "✓ Valid phone number: " + formatPhoneNumber(phone);
    phoneInput.style.borderColor = "#4caf50";
  } else {
    phoneHint.style.color = "#666";
    phoneHint.textContent = "e.g., 09171234567 or +639171234567";
    phoneInput.style.borderColor = "";
  }
});

phoneInput.addEventListener("focus", () => {
  if (!phoneInput.value) {
    phoneHint.style.color = "#666";
    phoneHint.textContent = "e.g., 09171234567 or +639171234567";
    phoneInput.style.borderColor = "";
  }
});

// ========== EMAIL VALIDATION ==========

emailInput.addEventListener("blur", (e) => {
  const email = e.target.value.trim();
  if (email && !isValidSLUEmail(email)) {
    emailHint.style.color = "#d32f2f";
    emailHint.textContent =
      "⚠ Please use a valid SLU email address (@slu.edu.ph)";
    emailInput.style.borderColor = "#d32f2f";
  } else if (email) {
    emailHint.style.color = "#2e7d32";
    emailHint.textContent = "✓ Valid SLU email address";
    emailInput.style.borderColor = "#4caf50";
  } else {
    emailHint.style.color = "#666";
    emailHint.textContent = "Please use your SLU email address (@slu.edu.ph)";
    emailInput.style.borderColor = "";
  }
});

emailInput.addEventListener("focus", () => {
  if (!emailInput.value) {
    emailHint.style.color = "#666";
    emailHint.textContent = "Please use your SLU email address (@slu.edu.ph)";
    emailInput.style.borderColor = "";
  }
});

// Toggle Password Visibility
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("toggle-password")) {
    const inputId = e.target.dataset.target;
    const input = document.getElementById(inputId);
    if (input.type === "password") {
      input.type = "text";
      e.target.textContent = "🔓";
    } else {
      input.type = "password";
      e.target.textContent = "🔒";
    }
  }
});

// Toggle Auth Mode
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  isSignIn = !isSignIn;
  updateFormUI();
}

// Update Form UI
function updateFormUI() {
  errorBox.style.display = "none";
  const strengthIndicator = document.getElementById("passwordStrength");
  const socialContainer = document.querySelector(".social-account-container");

  if (isSignIn) {
    // Sign In Mode
    formHeading.textContent = "Sign In";
    toggleText.innerHTML = `Don't have an account? <a id="toggleLink" href="#">Sign Up</a>`;
    submitButton.value = "Sign In";
    forgotPassword.style.display = "block";

    // Hide social sign in
    if (socialContainer) socialContainer.style.display = "none";

    // Hide signup fields
    signUpFieldsContainer.style.display = "none";
    firstNameInput.required = false;
    lastNameInput.required = false;
    phoneInput.required = false;

    // Hide confirm password
    confirmPasswordContainer.style.display = "none";
    document.getElementById("confirmPassword").required = false;

    // Hide strength indicator
    if (strengthIndicator) strengthIndicator.style.display = "none";

    // Reset phone hint
    phoneHint.style.color = "#666";
    phoneHint.textContent = "e.g., 09171234567 or +639171234567";
    phoneInput.style.borderColor = "";
  } else {
    // Sign Up Mode
    formHeading.textContent = "Sign Up";
    toggleText.innerHTML = `Already have an account? <a id="toggleLink" href="#">Sign In</a>`;
    submitButton.value = "Sign Up";
    forgotPassword.style.display = "none";

    // Hide social sign in
    if (socialContainer) socialContainer.style.display = "none";

    // Show signup fields
    signUpFieldsContainer.style.display = "block";
    firstNameInput.required = true;
    lastNameInput.required = true;
    phoneInput.required = true;

    // Show confirm password
    confirmPasswordContainer.style.display = "block";
    document.getElementById("confirmPassword").required = true;
  }

  // Re-attach toggle link event
  const toggleLink = document.getElementById("toggleLink");
  if (toggleLink) {
    toggleLink.addEventListener("click", toggleAuthMode);
  }
}

// Form Submission
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";

  const email = emailInput.value.trim();
  const password = document.getElementById("password").value.trim();

  // Validate Email
  if (!email) {
    showError("Please enter your email address.");
    emailInput.focus();
    return;
  }

  if (!isValidSLUEmail(email)) {
    showError("Please use a valid SLU email address ending with @slu.edu.ph");
    emailInput.focus();
    return;
  }

  // Validate Password
  if (!password) {
    showError("Please enter a password.");
    document.getElementById("password").focus();
    return;
  }

  if (!isSignIn) {
    // Sign Up Validation
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    // Validate First Name
    if (!firstName) {
      showError("Please enter your first name.");
      firstNameInput.focus();
      return;
    }

    if (!isValidName(firstName)) {
      showError("First name must contain only letters (2-50 characters).");
      firstNameInput.focus();
      return;
    }

    // Validate Last Name
    if (!lastName) {
      showError("Please enter your last name.");
      lastNameInput.focus();
      return;
    }

    if (!isValidName(lastName)) {
      showError("Last name must contain only letters (2-50 characters).");
      lastNameInput.focus();
      return;
    }

    // Validate Phone Number
    if (!phone) {
      showError("Please enter your phone number.");
      phoneInput.focus();
      return;
    }

    if (!isValidPhilippinePhone(phone)) {
      showError(
        "Please enter a valid Philippine phone number (e.g., 09171234567)."
      );
      phoneInput.focus();
      return;
    }

    // Check password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isStrong) {
      showError(
        "Password must meet all requirements: 8+ characters, uppercase, lowercase, number, and special character."
      );
      document.getElementById("password").focus();
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      document.getElementById("confirmPassword").focus();
      return;
    }
  }

  // Prepare data for submission
  const submitData = {
    email: email,
    password: password,
  };

  if (!isSignIn) {
    submitData.first_name = firstNameInput.value.trim();
    submitData.last_name = lastNameInput.value.trim();
    // Normalize phone number before sending (remove formatting, convert to 09 format)
    submitData.phone = normalizePhoneNumber(phoneInput.value.trim());
    submitData.confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();
  }

  // Submit to backend - Use absolute paths from document root
  const basePath = window.location.pathname.substring(
    0,
    window.location.pathname.lastIndexOf("/") + 1
  );
  const endpoint = isSignIn
    ? basePath + "routes/login.php"
    : basePath + "routes/register.php";

  try {
    submitButton.disabled = true;
    submitButton.value = isSignIn ? "Signing In..." : "Signing Up...";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitData),
    });

    const data = await response.json();

    if (data.success) {
      // Store token in localStorage for API calls
      if (data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
      }

      if (isSignIn) {
        window.location.href = data.data.dashboardPath;
      } else {
        window.location.href = data.data.redirect || "setRole.php";
      }
    } else {
      // Show error - Handle both string messages and array of errors
      if (data.errors && Array.isArray(data.errors)) {
        showError(data.errors.join(", "));
      } else if (data.message) {
        showError(data.message);
      } else {
        showError("Authentication failed. Please try again.");
      }
      submitButton.disabled = false;
      submitButton.value = isSignIn ? "Sign In" : "Sign Up";
    }
  } catch (error) {
    console.error("Error:", error);
    showError(
      "Could not connect to the server. Please check your internet connection."
    );
    submitButton.disabled = false;
    submitButton.value = isSignIn ? "Sign In" : "Sign Up";
  }
});

// Initialize
updateFormUI();