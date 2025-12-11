// public/views/driver/js/requirements.js
// UPDATED: Uses FormData for file uploads instead of base64

(function () {
    'use strict';

    const api = window.api;
    let currentDriverId = null;
    let currentVehicleId = null;

    // Status configuration
    const STATUS_CONFIG = {
        'unsubmitted': {
            label: 'Not Submitted',
            class: 'status-unsubmitted',
            canUpdate: true
        },
        'for_review': {
            label: 'Pending Review',
            class: 'status-pending',
            canUpdate: false
        },
        'verified': {
            label: 'Verified',
            class: 'status-verified',
            canUpdate: false
        },
        'rejected': {
            label: 'Rejected',
            class: 'status-rejected',
            canUpdate: true
        },
        'expired': {
            label: 'Expired',
            class: 'status-expired',
            canUpdate: true
        },
        'suspended': {
            label: 'Suspended',
            class: 'status-suspended',
            canUpdate: false
        }
    };

    /**
     * Initialize the requirements page
     */
    async function init() {
        console.log('Initializing driver requirements page...');

        try {
            await loadDriverDocuments();
            setupEventListeners();
            setupModals();
        } catch (error) {
            console.error('Error initializing:', error);
            showError('Failed to load requirements. Please refresh the page.');
        }
    }

    /**
     * Load driver documents and status
     */
    async function loadDriverDocuments() {
        try {
            const response = await api.getDriverProfile();

            if (response.success) {
                const profile = response.data;
                currentDriverId = profile.driverID;

                document.getElementById('welcomeMessage').textContent =
                    `Manage your driver documents, ${profile.first_name}!`;
                document.getElementById('userName').textContent =
                    `${profile.first_name} ${profile.last_name}`;
                document.getElementById('userEmail').textContent = profile.email;

                if (profile.profile_pic) {
                    const photoPath = `/${profile.profile_pic}`;
                    document.getElementById('profileIcon').src = photoPath;
                    document.getElementById('dropdownProfilePic').src = photoPath;
                }

                displayLicenseDocument(profile);
                await displayVehicleDocument(profile.driverID);
            } else {
                showError('Failed to load profile data');
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            throw error;
        }
    }

    /**
     * Display driver's license document and status
     */
    function displayLicenseDocument(profile) {
        const licenseStatus = document.getElementById('licenseStatus');
        const licensePreview = document.getElementById('licensePreview');
        const licenseNoDoc = document.getElementById('licenseNoDoc');
        const licenseNumber = document.getElementById('licenseNumber');
        const licenseExpiry = document.getElementById('licenseExpiry');
        const licenseRejectionMsg = document.getElementById('licenseRejectionMsg');
        const updateLicenseBtn = document.getElementById('updateLicenseBtn');

        const status = profile.license_status || 'unsubmitted';
        const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG['unsubmitted'];

        licenseStatus.innerHTML = `
            <span class="status-badge ${statusInfo.class}">
                ${statusInfo.icon} ${statusInfo.label}
            </span>
        `;

        if (profile.license_image) {
            licensePreview.src = `/${profile.license_image}`;
            licensePreview.style.display = 'block';
            licenseNoDoc.style.display = 'none';
        } else {
            licensePreview.style.display = 'none';
            licenseNoDoc.style.display = 'flex';
        }

        if (profile.license_number) {
            licenseNumber.textContent = `License #: ${profile.license_number}`;
            licenseNumber.style.display = 'block';
        } else {
            licenseNumber.style.display = 'none';
        }

        if (profile.license_expiry) {
            const expiryDate = new Date(profile.license_expiry);
            const formattedDate = expiryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            licenseExpiry.textContent = `Expiry: ${formattedDate}`;
            licenseExpiry.style.display = 'block';

            if (expiryDate < new Date()) {
                licenseExpiry.classList.add('text-danger');
            }
        } else {
            licenseExpiry.style.display = 'none';
        }

        if (status === 'rejected') {
            licenseRejectionMsg.innerHTML = `
                <strong>Document Rejected</strong><br>
                Your license image was not accepted. Please upload a clearer photo.
            `;
            licenseRejectionMsg.style.display = 'block';
        } else {
            licenseRejectionMsg.style.display = 'none';
        }

        updateLicenseBtn.style.display = 'block';
        updateLicenseBtn.disabled = (status === 'for_review');

        if (status === 'for_review') {
            updateLicenseBtn.innerHTML = 'Pending Review';
            updateLicenseBtn.style.cursor = 'not-allowed';
            updateLicenseBtn.style.opacity = '0.6';
        } else {
            updateLicenseBtn.innerHTML = 'Upload License';
            updateLicenseBtn.style.cursor = 'pointer';
            updateLicenseBtn.style.opacity = '1';
        }
    }

    /**
     * Display vehicle OR/CR document
     */
    async function displayVehicleDocument(driverId) {
        try {
            const response = await api.getDriverVehicles();

            if (response.success && response.data.length > 0) {
                const vehicle = response.data.find(v => v.vehicle_status === 'active') || response.data[0];
                currentVehicleId = vehicle.vehicleID;

                const orcrStatus = document.getElementById('orcrStatus');
                const orcrPreview = document.getElementById('orcrPreview');
                const orcrNoDoc = document.getElementById('orcrNoDoc');
                const vehicleInfo = document.getElementById('vehicleInfo');
                const orcrRejectionMsg = document.getElementById('orcrRejectionMsg');
                const updateOrcrBtn = document.getElementById('updateOrcrBtn');

                const status = vehicle.vehicle_status || 'active';
                let statusInfo = STATUS_CONFIG['verified'];

                if (status === 'for_renewal') statusInfo = STATUS_CONFIG['for_review'];
                if (status === 'expired') statusInfo = STATUS_CONFIG['expired'];
                if (status === 'rejected') statusInfo = STATUS_CONFIG['rejected'];

                orcrStatus.innerHTML = `
                    <span class="status-badge ${statusInfo.class}">
                        ${statusInfo.icon} ${statusInfo.label}
                    </span>
                `;

                if (vehicle.OR_CR) {
                    orcrPreview.src = `/${vehicle.OR_CR}`;
                    orcrPreview.style.display = 'block';
                    orcrNoDoc.style.display = 'none';
                } else {
                    orcrPreview.style.display = 'none';
                    orcrNoDoc.style.display = 'flex';
                }

                if (vehicle.plate_number) {
                    vehicleInfo.innerHTML = `
                        <p><strong>Vehicle:</strong> ${vehicle.brand || ''} ${vehicle.model || ''}</p>
                        <p><strong>Plate #:</strong> ${vehicle.plate_number}</p>
                        <p><strong>Year:</strong> ${vehicle.year || 'N/A'}</p>
                    `;
                    vehicleInfo.style.display = 'block';
                }

                if (status === 'rejected') {
                    orcrRejectionMsg.innerHTML = `
                        <strong>Document Rejected</strong><br>
                        Your OR/CR was not accepted. Please upload a clearer photo.
                    `;
                    orcrRejectionMsg.style.display = 'block';
                } else {
                    orcrRejectionMsg.style.display = 'none';
                }

                updateOrcrBtn.style.display = 'block';
                updateOrcrBtn.disabled = (status === 'for_renewal');

                if (status === 'for_renewal') {
                    updateOrcrBtn.innerHTML = 'Pending Review';
                    updateOrcrBtn.style.cursor = 'not-allowed';
                    updateOrcrBtn.style.opacity = '0.6';
                } else {
                    updateOrcrBtn.innerHTML = 'Upload OR/CR';
                    updateOrcrBtn.style.cursor = 'pointer';
                    updateOrcrBtn.style.opacity = '1';
                }
            }
        } catch (error) {
            console.error('Error loading vehicle documents:', error);
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLogout();
        });

        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            document.addEventListener('click', function (e) {
                if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('show');
                }
            });
        }

        document.getElementById('licensePreview')?.addEventListener('click', function () {
            if (this.src && this.src !== window.location.href) {
                openImageModal(this.src, 'Driver\'s License');
            }
        });

        document.getElementById('orcrPreview')?.addEventListener('click', function () {
            if (this.src && this.src !== window.location.href) {
                openImageModal(this.src, 'Vehicle OR/CR');
            }
        });

        document.getElementById('updateLicenseBtn')?.addEventListener('click', () => {
            openModal('updateLicenseModal');
        });

        document.getElementById('updateOrcrBtn')?.addEventListener('click', () => {
            openModal('updateOrcrModal');
        });
    }

    /**
     * Setup modals
     */
    function setupModals() {
        setupLicenseModal();
        setupOrcrModal();
    }

    /**
     * Setup License Modal
     */
    function setupLicenseModal() {
        const closeBtn = document.getElementById('closeLicenseModal');
        const cancelBtn = document.getElementById('cancelLicenseUpdate');
        const uploadBtn = document.getElementById('uploadNewLicenseBtn');
        const removeBtn = document.getElementById('removeNewLicenseBtn');
        const fileInput = document.getElementById('newLicenseInput');
        const preview = document.getElementById('newLicensePreview');
        const submitBtn = document.getElementById('submitLicenseUpdate');

        closeBtn.addEventListener('click', () => closeModal('updateLicenseModal'));
        cancelBtn.addEventListener('click', () => closeModal('updateLicenseModal'));

        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showError('Please upload an image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showError('Image size must be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="New License">`;
                removeBtn.style.display = 'inline-flex';
                submitBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        });

        removeBtn.addEventListener('click', () => {
            preview.innerHTML = `
                <div class="upload-placeholder">
                    <div class="icon"></div>
                    <p>Click upload to select your license image</p>
                    <p style="font-size: 12px;">Maximum file size: 10MB</p>
                </div>
            `;
            fileInput.value = '';
            removeBtn.style.display = 'none';
            submitBtn.disabled = true;
        });

        submitBtn.addEventListener('click', async () => {
            await submitLicenseUpdate();
        });
    }

    /**
     * Setup OR/CR Modal
     */
    function setupOrcrModal() {
        const closeBtn = document.getElementById('closeOrcrModal');
        const cancelBtn = document.getElementById('cancelOrcrUpdate');
        const uploadBtn = document.getElementById('uploadNewOrcrBtn');
        const removeBtn = document.getElementById('removeNewOrcrBtn');
        const fileInput = document.getElementById('newOrcrInput');
        const preview = document.getElementById('newOrcrPreview');
        const submitBtn = document.getElementById('submitOrcrUpdate');

        closeBtn.addEventListener('click', () => closeModal('updateOrcrModal'));
        cancelBtn.addEventListener('click', () => closeModal('updateOrcrModal'));

        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showError('Please upload an image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showError('Image size must be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="New OR/CR">`;
                removeBtn.style.display = 'inline-flex';
                submitBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        });

        removeBtn.addEventListener('click', () => {
            preview.innerHTML = `
                <div class="upload-placeholder">
                    <div class="icon">📄</div>
                    <p>Click upload to select your OR/CR image</p>
                    <p style="font-size: 12px;">Maximum file size: 10MB</p>
                </div>
            `;
            fileInput.value = '';
            removeBtn.style.display = 'none';
            submitBtn.disabled = true;
        });

        submitBtn.addEventListener('click', async () => {
            await submitOrcrUpdate();
        });
    }

    /**
     * Submit license update using FormData
     */
    async function submitLicenseUpdate() {
        const submitBtn = document.getElementById('submitLicenseUpdate');
        const fileInput = document.getElementById('newLicenseInput');
        const file = fileInput.files[0];

        if (!file) {
            showError('Please select a file');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        try {
            // Use global API helper which includes credentials and correct headers
            const data = await api.updateLicenseImage(file, currentDriverId);

            if (data.success) {
                showSuccess('License updated! Pending admin review.');
                closeModal('updateLicenseModal');
                await loadDriverDocuments();
            } else {
                showError(data.message || 'Failed to update license');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showError(error.message || 'Failed to update license. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload License';
        }
    }

    /**
     * Submit OR/CR update using FormData
     */
    async function submitOrcrUpdate() {
        const submitBtn = document.getElementById('submitOrcrUpdate');
        const fileInput = document.getElementById('newOrcrInput');
        const file = fileInput.files[0];

        if (!file) {
            showError('Please select a file');
            return;
        }

        if (!currentVehicleId) {
            showError('No vehicle found');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        try {
            // Use global API helper which includes credentials and correct headers
            const data = await api.updateVehicleOrcr(file, currentVehicleId);

            if (data.success) {
                showSuccess('OR/CR updated! Pending admin review.');
                closeModal('updateOrcrModal');
                await loadDriverDocuments();
            } else {
                showError(data.message || 'Failed to update OR/CR');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showError(error.message || 'Failed to update OR/CR. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload OR/CR';
        }
    }

    function openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    function openImageModal(imageSrc, title) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-backdrop"></div>
            <div class="image-modal-content">
                <div class="image-modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="image-modal-body">
                    <img src="${imageSrc}" alt="${title}">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.image-modal-backdrop').addEventListener('click', () => modal.remove());
    }

    async function handleLogout() {
        try {
            await api.logout();
            localStorage.removeItem('auth_token');
            window.location.href = 'http://localhost/Sakaybravo_Webtech_2025_Drainchain_9467/public/auth.php';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'http://localhost/Sakaybravo_Webtech_2025_Drainchain_9467/public/auth.php';
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();