<!DOCTYPE html>
<html>

<head>
    <title>Complete Registration - Sakay Bravo</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <link rel="icon" type="image/x-icon" href="./views/assets/Logo.png">
    <link rel="stylesheet" href="./css/setRole.css" />
</head>

<body>
    <div id="page-wrapper">
        <section id="header" class="wrapper">
            <div id="logo">
                <a href="">
                    <img src="./views/assets/SAKAY BRAVO LOGO_DARK YELLOW.png" alt="Sakay Bravo Logo" />
                </a>
                <p class="logo-caption">
                    Kasama mo sa biyahe, <br />
                    Kasama mo sa <i>SLU</i>
                </p>
            </div>

            <div class="container">
                <!-- Progress Indicator -->
                <div class="progress-container" id="progressContainer">
                    <div class="progress-line">
                        <div class="progress-line-fill active" id="progressFill"></div>
                    </div>
                </div>

                <div class="heading" id="formHeading">Choose Your Role</div>
                <div class="subheading" id="formSubheading">Select whether you want to register as a driver or passenger</div>

                <div class="error-message" id="errorMessage"></div>

                <form id="registrationForm">
                    <!-- Stage 1: Role Selection -->
                    <div class="form-stage active" id="stage1">
                        <div class="role-cards">
                            <div class="role-card" data-role="driver">
                                <div class="icon">🚗</div>
                                <div class="title">Driver</div>
                                <div class="description">Offer rides and earn</div>
                            </div>
                            <div class="role-card" data-role="passenger">
                                <div class="icon">🧳</div>
                                <div class="title">Passenger</div>
                                <div class="description">Find convenient rides</div>
                            </div>
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-primary" id="nextBtn" disabled>Next →</button>
                        </div>
                    </div>

                    <!-- ==================== DRIVER STAGES ==================== -->

                    <!-- Stage 2: Driver Details -->
                    <div class="form-stage" id="stage2Driver">
                        <div class="form-group">
                            <label>License Number * <span style="font-size: 12px; color: #666;">(Format: A00-00-000000)</span></label>
                            <input type="text" class="input" name="license_number" id="licenseNumber"
                                placeholder="e.g., N01-12-123456" maxlength="14">
                            <small style="color: #666; font-size: 11px;">Philippine driver's license format required</small>
                        </div>

                        <div class="form-group">
                            <label>License Type *</label>
                            <select class="input" name="license_type" id="licenseType">
                                <option value="">Select license type</option>
                                <option value="Professional">Professional</option>
                            </select>
                            <small style="color: #666; font-size: 11px;">Only professional licenses are accepted</small>
                        </div>

                        <div class="form-group">
                            <label>License Expiry Date *</label>
                            <input type="date" class="input" name="license_expiry" id="licenseExpiry">
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="backBtnDriver2">← Back</button>
                            <button type="button" class="btn btn-primary" id="nextBtnDriver2">Next →</button>
                        </div>
                    </div>

                    <!-- Stage 3: Driver License Image -->
                    <div class="form-stage" id="stage3Driver">
                        <div class="license-upload-container">
                            <div class="license-preview" id="licensePreview">
                                <div class="license-placeholder">
                                    <div class="icon"></div>
                                    <p>Upload your driver's license</p>
                                    <p style="font-size: 12px; margin-top: 5px;">Required for verification</p>
                                </div>
                            </div>

                            <div class="photo-buttons">
                                <button type="button" class="photo-btn" id="uploadLicenseBtn">
                                    <span>📁</span> Upload Photo
                                </button>
                                <button type="button" class="photo-btn remove" id="removeLicenseBtn"
                                    style="display: none;">
                                    <span>🗑️</span> Remove
                                </button>
                            </div>
                            <input type="file" id="licenseFileInput" accept="image/*" style="display:none;">
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="backBtnDriver3">← Back</button>
                            <button type="button" class="btn btn-primary" id="nextBtnDriver3" disabled>Next →</button>
                        </div>
                    </div>

                    <!-- Stage 4: Vehicle Information - UPDATED FOR OR/CR -->
                    <div class="form-stage" id="stage4Vehicle">
                        <div class="form-group">
                            <label>Vehicle Brand *</label>
                            <select class="input" name="vehicle_brand" id="vehicleBrand">
                                <option value="">Select brand</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Vehicle Model *</label>
                            <select class="input" name="vehicle_model" id="vehicleModel" disabled>
                                <option value="">Select model</option>
                            </select>
                            <small style="color: #666; font-size: 11px;">Select a brand first</small>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Color *</label>
                                <input type="text" class="input" name="vehicle_color" id="vehicleColor"
                                    placeholder="e.g., White, Black">
                            </div>

                            <div class="form-group">
                                <label>Year *</label>
                                <select class="input" name="vehicle_year" id="vehicleYear">
                                    <option value="">Select year</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Plate Number *</label>
                                <input type="text" class="input" name="plate_number" id="plateNumber"
                                    placeholder="e.g., ABC-1234" style="text-transform: uppercase;">
                            </div>

                            <div class="form-group">
                                <label>Seats Available *</label>
                                <select class="input" name="seats_available" id="seatsAvailable">
                                    <option value="">Select seats</option>
                                </select>
                            </div>
                        </div>

                        <!-- CHANGED: Vehicle Photo to OR/CR -->
                        <div class="photo-upload-container" style="margin-top: 20px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: 600;">
                                Vehicle OR/CR (Official Receipt / Certificate of Registration) *
                            </label>
                            <div class="photo-preview empty" id="orcrPreview" style="border-radius: 8px;">
                                <div class="photo-placeholder"></div>
                            </div>

                            <div class="photo-buttons">
                                <button type="button" class="photo-btn" id="uploadOrcrBtn">
                                    <span>📁</span> Upload OR/CR
                                </button>
                                <button type="button" class="photo-btn remove" id="removeOrcrBtn"
                                    style="display: none;">
                                    <span>🗑️</span> Remove
                                </button>
                            </div>
                            <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
                                Please upload a clear photo of your vehicle's Official Receipt or Certificate of Registration
                            </small>
                            <input type="file" id="orcrFileInput" accept="image/*" style="display:none;">
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="backBtnVehicle">← Back</button>
                            <button type="button" class="btn btn-primary" id="nextBtnVehicle" disabled>Next →</button>
                        </div>
                    </div>

                    <!-- Stage 5: Driver Profile Photo -->
                    <div class="form-stage" id="stage5DriverPhoto">
                        <div class="photo-upload-container">
                            <div class="photo-preview empty" id="driverPhotoPreview">
                                <div class="photo-placeholder">👤</div>
                            </div>

                            <div class="photo-buttons">
                                <button type="button" class="photo-btn" id="uploadDriverPhotoBtn">
                                    <span>📁</span> Upload Photo
                                </button>
                                <button type="button" class="photo-btn remove" id="removeDriverPhotoBtn"
                                    style="display: none;">
                                    <span>🗑️</span> Remove
                                </button>
                            </div>
                            <input type="file" id="driverPhotoFileInput" accept="image/*" style="display:none;">
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="backBtnDriver4">← Back</button>
                            <button type="submit" class="btn btn-primary" id="submitDriverBtn" disabled>Submit</button>
                        </div>
                    </div>

                    <!-- ==================== PASSENGER STAGES ==================== -->

                    <!-- Stage 2: Passenger Payment -->
                    <div class="form-stage" id="stage2Passenger">
                        <div class="form-group">
                            <label>Preferred Payment Method *</label>
                            <select class="input" name="preferred_payment" id="preferredPayment">
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                                <option value="maya">Maya</option>
                                <option value="debit">Debit Card</option>
                                <option value="credit">Credit Card</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label style="color: #666; font-weight: 400; font-size: 13px;">
                                ℹ️ You can change this later in your profile settings
                            </label>
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="backBtnPassenger2">← Back</button>
                            <button type="button" class="btn btn-primary" id="nextBtnPassenger2">Next →</button>
                        </div>
                    </div>

                    <!-- Stage 3: Passenger Profile Photo -->
                    <div class="form-stage" id="stage3Passenger">
                        <div class="photo-upload-container">
                            <div class="photo-preview empty" id="passengerPhotoPreview">
                                <div class="photo-placeholder">👤</div>
                            </div>

                            <div class="photo-buttons">
                                <button type="button" class="photo-btn" id="uploadPassengerPhotoBtn">
                                    <span>📁</span> Upload Photo
                                </button>
                                <button type="button" class="photo-btn remove" id="removePassengerPhotoBtn"
                                    style="display: none;">
                                    <span>🗑️</span> Remove
                                </button>
                            </div>
                            <input type="file" id="passengerPhotoFileInput" accept="image/*" style="display:none;">
                        </div>

                        <div class="button-group">
                            <button type="button" class="btn btn-secondary" id="backBtnPassenger3">← Back</button>
                            <button type="submit" class="btn btn-primary" id="submitPassengerBtn"
                                disabled>Submit</button>
                        </div>
                    </div>

                    <!-- ==================== FINAL STAGE ==================== -->

                    <!-- Final Stage: Success -->
                    <div class="form-stage" id="stageFinal">
                        <div style="text-align: center; margin: 20px 0;">
                            <div style="font-size: 60px; margin-bottom: 15px;"></div>
                            <h3 style="color: #4caf50; margin-bottom: 10px;">Registration Successful!</h3>
                            <p style="color: #666; font-size: 14px;">Your account has been created successfully.</p>
                        </div>

                        <div id="summaryContainer"></div>

                        <div class="button-group">
                            <button type="button" class="btn btn-primary" id="goToDashboardBtn">Go to Dashboard</button>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    </div>

    <script src="./js/setRole.js"></script>
</body>

</html>