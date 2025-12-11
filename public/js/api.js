// public/js/api.js
// Enhanced API Service with File Upload Support

(function (window) {
    'use strict';

    const API_BASE_URL = 'http://localhost:3000/api';

    class ApiService {
        constructor() {
            this.baseURL = API_BASE_URL;
            this.token = localStorage.getItem('auth_token');
        }

        // ==================== HELPER METHODS ====================

        /**
         * Get authorization headers
         */
        getHeaders(includeContentType = true) {
            const headers = {};

            if (includeContentType) {
                headers['Content-Type'] = 'application/json';
            }

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            return headers;
        }

        /**
         * Make API request
         */
        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;

            const config = {
                ...options,
                headers: {
                    ...this.getHeaders(options.body && !(options.body instanceof FormData)),
                    ...options.headers
                },
                credentials: 'include'
            };

            try {
                const response = await fetch(url, config);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }

                return data;
            } catch (error) {
                console.error('API Request Error:', error);
                throw error;
            }
        }

        /**
         * Upload file using FormData
         * @param {string} endpoint - API endpoint (e.g., '/driver/profile')
         * @param {File} file - File to upload
         * @param {Object} additionalData - Additional form fields and options
         *   - fileField: name of file form field (default: 'file')
         *   - method: HTTP method (default: 'POST', can be 'PUT' or 'POST')
         *   - other keys: additional form fields
         */
        async uploadFile(endpoint, file, additionalData = {}) {
            const formData = new FormData();
            const fileField = additionalData.fileField || 'file';
            const method = additionalData.method || 'POST';

            formData.append(fileField, file);

            // Add any additional data (skip reserved keys)
            for (const [key, value] of Object.entries(additionalData)) {
                if (['fileField', 'method'].includes(key)) continue;
                formData.append(key, value);
            }

            const url = `${this.baseURL}${endpoint}`;

            try {
                const headers = {};
                // Only set Authorization header if we have a token
                // Otherwise, rely on the auth_token cookie sent with credentials: 'include'
                if (this.token) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                }

                const response = await fetch(url, {
                    method: method,
                    headers: headers,
                    // Don't set Content-Type - let browser set it with boundary
                    credentials: 'include',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Upload failed');
                }

                return data;
            } catch (error) {
                console.error('File upload error:', error);
                throw error;
            }
        }

        // ==================== AUTH METHODS ====================

        /**
         * Verify authentication token
         */
        async verifyToken() {
            return this.request('/auth/verify', {
                method: 'POST'
            });
        }

        /**
         * Logout user
         */
        async logout() {
            try {
                await this.request('/auth/logout', {
                    method: 'POST'
                });
                localStorage.removeItem('auth_token');
                this.token = null;
            } catch (error) {
                localStorage.removeItem('auth_token');
                this.token = null;
                throw error;
            }
        }

        // ==================== DRIVER METHODS ====================

        /**
         * Get driver profile
         */
        async getDriverProfile() {
            return this.request('/driver/profile');
        }

        /**
         * Get driver statistics
         */
        async getDriverStats() {
            return this.request('/driver/stats');
        }

        /**
         * Update driver license image
         */
        async updateLicenseImage(file, driverId) {
            return this.uploadFile('/driver/update-license', file, { fileField: 'licenseImage', driverId });
        }

        /**
         * Update user profile (name, phone)
         */
        async updateProfile(updates) {
            return this.request('/driver/profile', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
        }

        /**
         * Update profile photo 
         */
        async updateProfilePhoto(file, additional = {}) {
            return this.uploadFile('/driver/profile', file, Object.assign({ fileField: 'profile_pic', method: 'PUT' }, additional));
        }

        /**
         * Create a new ride
         */
        async createRide(rideData) {
            return this.request('/driver/rides', {
                method: 'POST',
                body: JSON.stringify(rideData)
            });
        }

        /**
         * Get all driver rides
         */
        async getDriverRides(status = null) {
            const endpoint = status
                ? `/driver/rides?status=${status}`
                : '/driver/rides';
            return this.request(endpoint);
        }

        /**
         * Get active/upcoming rides
         */
        async getActiveRides() {
            return this.request('/driver/rides/active');
        }

        /**
         * Get specific ride details
         */
        async getRideById(rideId) {
            return this.request(`/driver/rides/${rideId}`);
        }

        /**
         * Update ride
         */
        async updateRide(rideId, updates) {
            return this.request(`/driver/rides/${rideId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
        }

        /**
         * Cancel ride
         */
        async cancelRide(rideId) {
            return this.request(`/driver/rides/${rideId}/cancel`, {
                method: 'POST'
            });
        }

        /**
         * Get ride history with stats
         */
        async getRideHistory(sortOrder = 'DESC', limit = 10, offset = 0) {
            return this.request(`/driver/rides/history?sortOrder=${sortOrder}&limit=${limit}&offset=${offset}`);
        }

        /**
         * Get driver vehicles
         */
        async getDriverVehicles() {
            return this.request('/driver/vehicles');
        }

        /**
         * Update vehicle OR/CR image
         */
        async updateVehicleOrcr(file, vehicleId) {
            return this.uploadFile('/driver/update-orcr', file, { fileField: 'orcrImage', vehicleId });
        }

        // ==================== PASSENGER METHODS ====================

        /**
         * Get passenger profile
         */
        async getPassengerProfile() {
            return this.request('/passenger/profile');
        }

        /**
         * Search for available rides
         */
        async searchRides(filters) {
            const params = new URLSearchParams();

            if (filters.origin) params.append('origin', filters.origin);
            if (filters.destination) params.append('destination', filters.destination);
            if (filters.date) params.append('date', filters.date);

            return this.request(`/passenger/rides/search?${params.toString()}`);
        }

        /**
         * Get passenger bookings
         */
        async getPassengerBookings() {
            return this.request('/passenger/bookings');
        }

        /**
         * Create a booking
         */
        async createBooking(bookingData) {
            return this.request('/passenger/bookings', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });
        }

        /**
         * Cancel booking
         */
        async cancelBooking(bookingId) {
            return this.request(`/passenger/bookings/${bookingId}/cancel`, {
                method: 'POST'
            });
        }
    }

    // Create global instance
    window.api = new ApiService();

    console.log('API Service initialized');

})(window);