import axios from 'axios';

class ApiClient {
    constructor() {
        // Create axios instance with base configuration
        this.client = axios.create({
            baseURL: 'https://admin.ipro-booking.com/api/hotel',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 seconds timeout
        });

        // Credentials configuration
        this.credentials = {
            Login: 'fEGaXEei4E2A6vb3Nfs',
            Password: 'LheK+ChFpVQc25ExP4f3',
        };

        // Setup interceptors
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // You can add additional headers or logging here
                console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                console.log('API Response:', response.status);
                return response;
            },
            (error) => {
                // Centralized error handling
                if (error.response) {
                    // Server responded with error status
                    console.error('API Error:', error.response.status, error.response.data);

                    switch (error.response.status) {
                        case 401:
                            console.error('Unauthorized access');
                            break;
                        case 404:
                            console.error('Resource not found');
                            break;
                        case 500:
                            console.error('Internal server error');
                            break;
                        default:
                            console.error('API request failed');
                    }
                } else if (error.request) {
                    // Request was made but no response received
                    console.error('Network error: No response from server');
                } else {
                    // Something else happened
                    console.error('Error:', error.message);
                }

                return Promise.reject(error);
            }
        );
    }

    // Helper method to create request body with credentials
    createRequestBody(additionalData = {}) {
        return {
            Credential: this.credentials,
            ...additionalData,
        };
    }

    // ==================== List Endpoints ====================

    async listCountry() {
        try {
            const response = await this.client.post('/ListCountry',
                this.createRequestBody()
            );
            return response.data.ListCountry || [];
        } catch (error) {
            throw error;
        }
    }

    async listCity() {
        try {
            const response = await this.client.post('/ListCity',
                this.createRequestBody()
            );
            return response.data.ListCity || [];
        } catch (error) {
            throw error;
        }
    }

    async listCategorie() {
        try {
            const response = await this.client.post('/ListCategorie',
                this.createRequestBody()
            );
            return response.data.ListCategorie || [];
        } catch (error) {
            throw error;
        }
    }

    async listTag() {
        try {
            const response = await this.client.post('/ListTag',
                this.createRequestBody()
            );
            return response.data.ListTag || [];
        } catch (error) {
            throw error;
        }
    }

    async listBoarding() {
        try {
            const response = await this.client.post('/ListBoarding',
                this.createRequestBody()
            );
            return response.data.ListBoarding || [];
        } catch (error) {
            throw error;
        }
    }

    async listCurrency() {
        try {
            const response = await this.client.post('/ListCurrency',
                this.createRequestBody()
            );
            // Return full response as it contains additional metadata
            return {
                currencies: response.data.ListCurrency || [],
                countResults: response.data.CountResults || 0,
                errorMessage: response.data.ErrorMessage || [],
                timing: response.data.Timing || null,
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================== Hotel Endpoints ====================

    /**
     * Get list of hotels
     * @param {number|null} cityId - Optional city ID to filter hotels by city
     * @returns {Promise} API response with hotel list
     */
    async listHotel(cityId = null) {
        try {
            const requestBody = cityId
                ? this.createRequestBody({City: cityId})
                : this.createRequestBody();

            const response = await this.client.post('/ListHotel', requestBody);
            return response.data.ListHotel || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get detailed information for a specific hotel
     * @param {number} hotelId - The hotel ID
     * @returns {Promise} API response with hotel details
     */
    async getHotelDetail(hotelId) {
        try {
            if (!hotelId) {
                throw new Error('Hotel ID is required');
            }

            const response = await this.client.post('/HotelDetail',
                this.createRequestBody({Hotel: hotelId})
            );

            // Return full response with metadata
            return {
                hotelDetail: response.data.HotelDetail || null,
                errorMessage: response.data.ErrorMessage || [],
                timing: response.data.Timing || null,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search for hotels with detailed filters and booking parameters
     * @param {Object} searchParams - Search parameters object
     * @param {string} searchParams.checkIn - Check-in date (YYYY-MM-DD format) - REQUIRED
     * @param {string} searchParams.checkOut - Check-out date (YYYY-MM-DD format) - REQUIRED
     * @param {number[]} searchParams.hotels - Array of hotel IDs - REQUIRED
     * @param {Object|null} searchParams.filters - Filters object or null
     * @param {string} searchParams.filters.keywords - Search keywords
     * @param {number[]} searchParams.filters.category - Array of category IDs
     * @param {boolean} searchParams.filters.onlyAvailable - Show only available hotels
     * @param {number[]} searchParams.filters.tags - Array of tag IDs
     * @param {Array} searchParams.rooms - Array of room objects (required)
     * @param {number} searchParams.rooms[].adult - Number of adults per room
     * @param {number[]|null} searchParams.rooms[].child - Array of children ages or null
     * @returns {Promise} API response with search results
     */
    async searchHotel(searchParams = {}) {
        try {
            // Validate required BookingDetails parameters
            if (!searchParams.checkIn) {
                throw new Error('checkIn is a required parameter');
            }

            if (!searchParams.checkOut) {
                throw new Error('checkOut is a required parameter');
            }

            if (!searchParams.hotels || !Array.isArray(searchParams.hotels) || searchParams.hotels.length === 0) {
                throw new Error('hotels is a required parameter and must be a non-empty array');
            }

            // Validate rooms parameter (required)
            if (!searchParams.rooms || !Array.isArray(searchParams.rooms) || searchParams.rooms.length === 0) {
                throw new Error('rooms is a required parameter and must be a non-empty array');
            }

            // Validate date format (optional but recommended)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(searchParams.checkIn)) {
                throw new Error('checkIn must be in YYYY-MM-DD format');
            }
            if (!dateRegex.test(searchParams.checkOut)) {
                throw new Error('checkOut must be in YYYY-MM-DD format');
            }

            // Build BookingDetails object (all fields now required)
            const bookingDetails = {
                CheckIn: searchParams.checkIn,
                CheckOut: searchParams.checkOut,
                Hotels: searchParams.hotels
            };

            // Build Filters object with defaults
            const filters = searchParams.filters || {};
            const searchFilters = {
                Keywords: filters.keywords || "",
                Category: filters.category || [],
                OnlyAvailable: filters.onlyAvailable || false,
                Tags: filters.tags || []
            };

            // Build Rooms array
            const rooms = searchParams.rooms.map(room => {
                const roomObj = {
                    Adult: room.adult || room.Adult || 2
                };

                // Only add Child property if it exists and has values
                if (room.child && Array.isArray(room.child) && room.child.length > 0) {
                    roomObj.Child = room.child;
                } else if (room.Child && Array.isArray(room.Child) && room.Child.length > 0) {
                    roomObj.Child = room.Child;
                }

                return roomObj;
            });

            // Build complete request body
            const requestBody = this.createRequestBody({
                SearchDetails: {
                    BookingDetails: bookingDetails,
                    Filters: searchFilters,
                    Rooms: rooms
                }
            });

            const response = await this.client.post('/HotelSearch', requestBody);

            // Return full response with metadata and error handling
            return {
                hotelSearch: response.data.HotelSearch || [],
                countResults: response.data.CountResults || 0,
                errorMessage: response.data.ErrorMessage || null,
                searchId: response.data.SearchId || null,
                timing: response.data.Timing || null,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get enhanced list of hotels with full details (Batch Processing)
     * This method fetches hotels list and enriches each with detailed information
     * using controlled batch processing for optimal server performance
     * @param {number|null} cityId - Optional city ID to filter hotels by city
     * @param {Object} options - Additional options
     * @param {number} options.batchSize - Number of hotels to process per batch (default: 5)
     * @param {number} options.delayBetweenBatches - Delay in ms between batches (default: 100)
     * @param {Function} options.onProgress - Callback for progress updates (current, total)
     * @param {Function} options.onBatchComplete - Callback when each batch completes
     * @returns {Promise<Array>} Array of enhanced hotel objects
     */
    async listHotelEnhanced(cityId = null, options = {}) {
        try {
            const {
                batchSize = 5,
                delayBetweenBatches = 100,
                onProgress = null,
                onBatchComplete = null
            } = options;

            // Step 1: Get the list of hotels
            console.log('📋 Fetching hotel list...');
            const hotelsList = await this.listHotel(cityId);

            if (!hotelsList || hotelsList.length === 0) {
                console.log('❌ No hotels found');
                return [];
            }

            console.log(`✅ Found ${hotelsList.length} hotels. Starting batch processing...`);

            // Step 2: Process hotels in batches
            const enhancedHotels = [];
            const totalBatches = Math.ceil(hotelsList.length / batchSize);

            for (let i = 0; i < hotelsList.length; i += batchSize) {
                const batch = hotelsList.slice(i, i + batchSize);
                const currentBatch = Math.floor(i / batchSize) + 1;

                console.log(`🔄 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);

                // Process current batch in parallel
                const batchPromises = batch.map(hotel =>
                    this.getHotelDetail(hotel.Id)
                        .then(result => {
                            const enhanced = this._mergeHotelData(hotel, result.hotelDetail);
                            console.log(`✓ Enhanced hotel: ${hotel.Name}`);
                            return enhanced;
                        })
                        .catch(error => {
                            console.error(`✗ Error fetching details for hotel ${hotel.Id} (${hotel.Name}):`, error.message);
                            // Return original hotel data if detail fetch fails
                            return {
                                ...hotel,
                                _enhanced: false,
                                _error: error.message
                            };
                        })
                );

                // Wait for current batch to complete
                const batchResults = await Promise.all(batchPromises);
                enhancedHotels.push(...batchResults);

                // Call progress callback
                if (onProgress) {
                    onProgress(enhancedHotels.length, hotelsList.length);
                }

                // Call batch complete callback
                if (onBatchComplete) {
                    onBatchComplete(currentBatch, totalBatches, batchResults);
                }

                console.log(`✅ Batch ${currentBatch}/${totalBatches} completed (Total processed: ${enhancedHotels.length}/${hotelsList.length})`);

                // Add delay between batches to avoid overwhelming server
                if (i + batchSize < hotelsList.length) {
                    console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            console.log(`🎉 All batches completed! Enhanced ${enhancedHotels.length} hotels.`);
            return enhancedHotels;

        } catch (error) {
            console.error('❌ Error in listHotelEnhanced:', error);
            throw error;
        }
    }

    /**
     * Merge data from ListHotel and HotelDetail
     * Creates a comprehensive hotel object with all available information
     * @private
     */
    _mergeHotelData(listHotelData, hotelDetailData) {
        if (!hotelDetailData) {
            return {
                ...listHotelData,
                _enhanced: false,
                _sourceListHotel: true,
                _sourceHotelDetail: false
            };
        }

        return {
            // ============ Core Information ============
            Id: listHotelData.Id,
            Name: listHotelData.Name,

            // ============ Category (Merged) ============
            Category: {
                Id: listHotelData.Category?.Id,
                Title: hotelDetailData.Category?.Title || listHotelData.Category?.Title,
                Star: hotelDetailData.Category?.Star || listHotelData.Category?.Star
            },

            // ============ Location (Merged) ============
            City: {
                Id: listHotelData.City?.Id,
                Name: listHotelData.City?.Name || hotelDetailData.City?.Name,
                Country: listHotelData.City?.Country || {
                    Name: hotelDetailData.City?.Country
                }
            },

            // ============ From ListHotel ============
            ShortDescription: listHotelData.ShortDescription,
            Adress: listHotelData.Adress,
            Localization: listHotelData.Localization,
            Facilities: listHotelData.Facilities || [],

            // ============ From HotelDetail ============
            Email: hotelDetailData.Email,
            Phone: hotelDetailData.Phone,
            Vues: hotelDetailData.Vues || [],
            Type: hotelDetailData.Type,
            Album: hotelDetailData.Album || [],
            Tag: hotelDetailData.Tag || [],
            Boarding: hotelDetailData.Boarding || [],

            // ============ Images (Combined) ============
            Image: listHotelData.Image || hotelDetailData.Image,

            // ============ Theme (Prefer HotelDetail) ============
            Theme: hotelDetailData.Theme || listHotelData.Theme || [],

            // ============ Metadata ============
            _enhanced: true,
            _sourceListHotel: true,
            _sourceHotelDetail: true,
            _mergedAt: new Date().toISOString()
        };
    }

}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;
