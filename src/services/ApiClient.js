import axios from 'axios';

// ==================== CONSTANTS ====================
const CONFIG = {
    BASE_URL: 'https://admin.ipro-booking.com/api/hotel',
    TIMEOUT: {
        DEFAULT: 60000,      // 60 seconds
        SEARCH: 120000,      // 2 minutes for search requests
    },
    BATCH: {
        DEFAULT_SIZE: 5,
        DEFAULT_DELAY: 100,  // ms between batches
    },
    LIMITS: {
        MAX_HOTELS_PER_SEARCH: 20,
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        BASE_DELAY: 1000,    // ms
        MAX_DELAY: 5000,     // ms
    },
    CACHE: {
        TTL: 5 * 60 * 1000, // 5 minutes
        ENABLED: true,
    }
};

const CREDENTIALS = {
    Login: 'fEGaXEei4E2A6vb3Nfs',
    Password: 'LheK+ChFpVQc25ExP4f3',
};

// Error messages in multiple languages
const ERROR_MESSAGES = {
    en: {
        TIMEOUT: (count) => `Search took too long (${count} hotels). Please reduce the number of hotels.`,
        NETWORK: 'Network error: Unable to contact server. Check your connection.',
        HOTEL_ID_REQUIRED: 'Hotel ID is required',
        HOTEL_NOT_FOUND: (id) => `Hotel with ID ${id} not found`,
        CHECKIN_REQUIRED: 'checkIn is a required parameter',
        CHECKOUT_REQUIRED: 'checkOut is a required parameter',
        HOTELS_REQUIRED: 'hotels is a required parameter and must be a non-empty array',
        ROOMS_REQUIRED: 'rooms is a required parameter and must be a non-empty array',
        INVALID_DATE_FORMAT: (field) => `${field} must be in YYYY-MM-DD format`,
        UNAUTHORIZED: 'Unauthorized access - check credentials',
        NOT_FOUND: 'Resource not found',
        SERVER_ERROR: 'Internal server error',
        REQUEST_FAILED: 'API request failed',
    },
    fr: {
        TIMEOUT: (count) => `La recherche a pris trop de temps (${count} hôtels). Veuillez réduire le nombre d'hôtels.`,
        NETWORK: 'Erreur réseau: impossible de contacter le serveur. Vérifiez votre connexion.',
        HOTEL_ID_REQUIRED: 'L\'ID de l\'hôtel est requis',
        HOTEL_NOT_FOUND: (id) => `Hôtel avec l'ID ${id} introuvable`,
        CHECKIN_REQUIRED: 'La date d\'arrivée est requise',
        CHECKOUT_REQUIRED: 'La date de départ est requise',
        HOTELS_REQUIRED: 'La liste des hôtels est requise et ne doit pas être vide',
        ROOMS_REQUIRED: 'La liste des chambres est requise et ne doit pas être vide',
        INVALID_DATE_FORMAT: (field) => `${field} doit être au format YYYY-MM-DD`,
        UNAUTHORIZED: 'Accès non autorisé - vérifiez les identifiants',
        NOT_FOUND: 'Ressource introuvable',
        SERVER_ERROR: 'Erreur interne du serveur',
        REQUEST_FAILED: 'La requête API a échoué',
    }
};

// ==================== CACHE MANAGER ====================
class CacheManager {
    constructor(ttl = CONFIG.CACHE.TTL) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > this.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }

    // Get cache stats for debugging
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// ==================== API CLIENT ====================
class ApiClient {
    constructor(language = 'en') {
        // Language for error messages
        this.language = language;
        this.messages = ERROR_MESSAGES[language] || ERROR_MESSAGES.en;

        // Create axios instance with base configuration
        this.client = axios.create({
            baseURL: CONFIG.BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: CONFIG.TIMEOUT.DEFAULT,
        });

        // Credentials configuration
        this.credentials = CREDENTIALS;

        // Cache manager
        this.cache = new CacheManager(CONFIG.CACHE.TTL);

        // Cancel token sources for ongoing requests
        this.cancelTokens = new Map();

        // Setup interceptors
        this.setupInterceptors();
    }

    // ==================== LANGUAGE SETTER ====================
    setLanguage(lang) {
        if (ERROR_MESSAGES[lang]) {
            this.language = lang;
            this.messages = ERROR_MESSAGES[lang];
        }
    }

    // ==================== INTERCEPTORS ====================
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('API Response:', response.status);
                }
                return response;
            },
            (error) => {
                // Handle request cancellation
                if (axios.isCancel(error)) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Request cancelled:', error.message);
                    }
                    return Promise.reject({
                        message: 'Request cancelled',
                        isCancelled: true,
                        timestamp: new Date().toISOString(),
                    });
                }

                // Create structured error object
                const apiError = {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    isNetworkError: !error.response,
                    isTimeout: error.code === 'ECONNABORTED',
                    timestamp: new Date().toISOString(),
                };

                // Centralized error handling
                if (process.env.NODE_ENV === 'development') {
                    if (error.code === 'ECONNABORTED') {
                        console.error('⏱️ Request timeout - server took too long to respond');
                    } else if (error.response) {
                        console.error('API Error:', error.response.status, error.response.data);

                        switch (error.response.status) {
                            case 401:
                                console.error(this.messages.UNAUTHORIZED);
                                break;
                            case 404:
                                console.error(this.messages.NOT_FOUND);
                                break;
                            case 500:
                                console.error(this.messages.SERVER_ERROR);
                                break;
                            default:
                                console.error(this.messages.REQUEST_FAILED);
                        }
                    } else if (error.request) {
                        console.error('Network error: No response from server');
                    } else {
                        console.error('Error:', error.message);
                    }
                }

                return Promise.reject(apiError);
            }
        );
    }

    // ==================== RETRY LOGIC ====================
    /**
     * Retry a request with exponential backoff
     * @param {Function} requestFn - The request function to retry
     * @param {number} maxAttempts - Maximum number of retry attempts
     * @returns {Promise} - The result of the request
     */
    async retryRequest(requestFn, maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;

                // Don't retry if request was cancelled
                if (error.isCancelled) {
                    throw error;
                }

                // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
                const shouldNotRetry = error.status >= 400 &&
                    error.status < 500 &&
                    error.status !== 408 &&
                    error.status !== 429;

                if (shouldNotRetry) {
                    throw error;
                }

                // Don't retry on last attempt
                if (attempt === maxAttempts) {
                    break;
                }

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw error;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    CONFIG.RETRY.BASE_DELAY * Math.pow(2, attempt - 1),
                    CONFIG.RETRY.MAX_DELAY
                );

                if (process.env.NODE_ENV === 'development') {
                    console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // All retries failed
        if (process.env.NODE_ENV === 'development') {
            console.error(`❌ All ${maxAttempts} retry attempts failed`);
        }
        throw lastError;
    }

    /**
     * Check if an error is retryable
     * @param {Object} error - The error object
     * @returns {boolean} - Whether the error is retryable
     */
    isRetryableError(error) {
        // Retry on network errors
        if (error.isNetworkError) return true;

        // Retry on timeout errors
        if (error.isTimeout) return true;

        // Retry on 5xx server errors
        if (error.status >= 500) return true;

        // Retry on 408 (Request Timeout) and 429 (Too Many Requests)
        if (error.status === 408 || error.status === 429) return true;

        return false;
    }

    // ==================== CANCEL TOKEN MANAGEMENT ====================
    /**
     * Create a cancel token for a request
     * @param {string} key - Unique key for the request
     * @returns {CancelTokenSource} - The cancel token source
     */
    createCancelToken(key) {
        // Cancel previous request with same key if exists
        this.cancelRequest(key);

        const source = axios.CancelToken.source();
        this.cancelTokens.set(key, source);
        return source;
    }

    /**
     * Cancel a request by key
     * @param {string} key - The request key
     */
    cancelRequest(key) {
        const source = this.cancelTokens.get(key);
        if (source) {
            source.cancel(`Request ${key} cancelled`);
            this.cancelTokens.delete(key);
        }
    }

    /**
     * Cancel all ongoing requests
     */
    cancelAllRequests() {
        this.cancelTokens.forEach((source, key) => {
            source.cancel(`All requests cancelled`);
        });
        this.cancelTokens.clear();
    }

    // ==================== HELPER METHODS ====================
    /**
     * Create request body with credentials
     * @param {Object} additionalData - Additional data to include in request
     * @returns {Object} - Request body with credentials
     */
    createRequestBody(additionalData = {}) {
        return {
            Credential: this.credentials,
            ...additionalData,
        };
    }

    // ==================== CACHED LIST ENDPOINTS ====================
    /**
     * List all countries (cached)
     */
    async listCountry() {
        const cacheKey = 'countries';

        // Check cache first
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Using cached countries');
                }
                return cached;
            }
        }

        // Fetch from API with retry
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCountry',
                this.createRequestBody()
            );
            return response.data.ListCountry || [];
        });

        // Cache the result
        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * List all cities (cached)
     */
    async listCity() {
        const cacheKey = 'cities';

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Using cached cities');
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCity',
                this.createRequestBody()
            );
            return response.data.ListCity || [];
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * List all categories (cached)
     */
    async listCategorie() {
        const cacheKey = 'categories';

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Using cached categories');
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCategorie',
                this.createRequestBody()
            );
            return response.data.ListCategorie || [];
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * List all tags (cached)
     */
    async listTag() {
        const cacheKey = 'tags';

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Using cached tags');
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListTag',
                this.createRequestBody()
            );
            return response.data.ListTag || [];
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * List all boarding options (cached)
     */
    async listBoarding() {
        const cacheKey = 'boarding';

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Using cached boarding options');
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListBoarding',
                this.createRequestBody()
            );
            return response.data.ListBoarding || [];
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * List all currencies (cached)
     */
    async listCurrency() {
        const cacheKey = 'currencies';

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Using cached currencies');
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCurrency',
                this.createRequestBody()
            );
            return {
                currencies: response.data.ListCurrency || [],
                countResults: response.data.CountResults || 0,
                errorMessage: response.data.ErrorMessage || [],
                timing: response.data.Timing || null,
            };
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    // ==================== HOTEL ENDPOINTS ====================
    /**
     * List hotels by city (with caching for specific cities)
     */
    async listHotel(cityId = null) {
        const cacheKey = cityId ? `hotels_city_${cityId}` : 'hotels_all';

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ Using cached hotel list (${cacheKey})`);
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const requestBody = cityId
                ? this.createRequestBody({City: cityId})
                : this.createRequestBody();

            const response = await this.client.post('/ListHotel', requestBody);
            return response.data.ListHotel || [];
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * Get hotel details by ID (with caching)
     */
    async getHotel(hotelId) {
        if (!hotelId) {
            throw new Error(this.messages.HOTEL_ID_REQUIRED);
        }

        const cacheKey = `hotel_${hotelId}`;

        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ Using cached hotel detail (${hotelId})`);
                }
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/HotelDetail',
                this.createRequestBody({Hotel: hotelId})
            );

            const hotelDetail = response.data.HotelDetail || null;

            if (!hotelDetail) {
                throw new Error(
                    typeof this.messages.HOTEL_NOT_FOUND === 'function'
                        ? this.messages.HOTEL_NOT_FOUND(hotelId)
                        : `Hotel with ID ${hotelId} not found`
                );
            }

            return hotelDetail;
        });

        if (CONFIG.CACHE.ENABLED) {
            this.cache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * Get full hotel details (not cached as frequently)
     */
    async getHotelDetail(hotelId) {
        if (!hotelId) {
            throw new Error(this.messages.HOTEL_ID_REQUIRED);
        }

        return await this.retryRequest(async () => {
            const response = await this.client.post('/HotelDetail',
                this.createRequestBody({Hotel: hotelId})
            );

            return {
                hotelDetail: response.data.HotelDetail || null,
                errorMessage: response.data.ErrorMessage || [],
                timing: response.data.Timing || null,
            };
        });
    }

    /**
     * Get multiple hotels in batches
     */
    async getHotelsBatch(hotelIds = [], options = {}) {
        if (!Array.isArray(hotelIds) || hotelIds.length === 0) {
            return {};
        }

        const {
            batchSize = CONFIG.BATCH.DEFAULT_SIZE,
            delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY
        } = options;

        if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Fetching ${hotelIds.length} hotels in batches of ${batchSize}...`);
        }

        const hotelsMap = {};
        const totalBatches = Math.ceil(hotelIds.length / batchSize);

        for (let i = 0; i < hotelIds.length; i += batchSize) {
            const batch = hotelIds.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;

            if (process.env.NODE_ENV === 'development') {
                console.log(`📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);
            }

            const batchPromises = batch.map(id =>
                this.getHotel(id)
                    .then(hotel => ({ id, hotel, success: true }))
                    .catch(error => {
                        if (process.env.NODE_ENV === 'development') {
                            console.error(`❌ Failed to fetch hotel ${id}:`, error.message);
                        }
                        return { id, hotel: null, success: false, error: error.message };
                    })
            );

            const batchResults = await Promise.all(batchPromises);

            batchResults.forEach(result => {
                if (result.success && result.hotel) {
                    hotelsMap[result.id] = result.hotel;
                }
            });

            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Batch ${currentBatch}/${totalBatches} completed`);
            }

            if (i + batchSize < hotelIds.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`✨ Fetched ${Object.keys(hotelsMap).length}/${hotelIds.length} hotels successfully`);
        }

        return hotelsMap;
    }

    /**
     * Search for hotels with availability (with request cancellation)
     */
    async searchHotel(searchParams = {}) {
        // Create unique cancel token for this search
        const cancelToken = this.createCancelToken('hotelSearch');

        try {
            // Validate required BookingDetails parameters
            if (!searchParams.checkIn) {
                throw new Error(this.messages.CHECKIN_REQUIRED);
            }

            if (!searchParams.checkOut) {
                throw new Error(this.messages.CHECKOUT_REQUIRED);
            }

            if (!searchParams.hotels || !Array.isArray(searchParams.hotels) || searchParams.hotels.length === 0) {
                throw new Error(this.messages.HOTELS_REQUIRED);
            }

            if (!searchParams.rooms || !Array.isArray(searchParams.rooms) || searchParams.rooms.length === 0) {
                throw new Error(this.messages.ROOMS_REQUIRED);
            }

            // Limit hotels to prevent timeout
            const limitedHotels = searchParams.hotels.slice(0, CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH);

            if (searchParams.hotels.length > CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH) {
                console.warn(`⚠️ Hotel search limited to ${CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH} hotels (requested: ${searchParams.hotels.length})`);
            }

            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(searchParams.checkIn)) {
                throw new Error(
                    typeof this.messages.INVALID_DATE_FORMAT === 'function'
                        ? this.messages.INVALID_DATE_FORMAT('checkIn')
                        : 'checkIn must be in YYYY-MM-DD format'
                );
            }
            if (!dateRegex.test(searchParams.checkOut)) {
                throw new Error(
                    typeof this.messages.INVALID_DATE_FORMAT === 'function'
                        ? this.messages.INVALID_DATE_FORMAT('checkOut')
                        : 'checkOut must be in YYYY-MM-DD format'
                );
            }

            // Build BookingDetails object
            const bookingDetails = {
                CheckIn: searchParams.checkIn,
                CheckOut: searchParams.checkOut,
                Hotels: limitedHotels
            };

            // Build Filters object with defaults
            const filters = searchParams.filters || {};
            const searchFilters = {
                Keywords: filters.keywords || "",
                Category: filters.category || [],
                OnlyAvailable: filters.onlyAvailable !== undefined ? filters.onlyAvailable : true,
                Tags: filters.tags || []
            };

            // Build Rooms array
            const rooms = searchParams.rooms.map(room => {
                const roomObj = {
                    Adult: room.adult || room.Adult || 2
                };

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

            if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 Searching ${limitedHotels.length} hotels...`);
                const bodySize = JSON.stringify(requestBody).length;
                console.log(`📦 Request size: ${(bodySize / 1024).toFixed(2)} KB`);
            }

            // Make request with retry logic and cancellation support
            const response = await this.retryRequest(async () => {
                return await this.client.post('/HotelSearch', requestBody, {
                    timeout: CONFIG.TIMEOUT.SEARCH,
                    cancelToken: cancelToken.token
                });
            });

            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Search returned ${response.data.HotelSearch?.length || 0} results`);
            }

            // Cleanup cancel token
            this.cancelTokens.delete('hotelSearch');

            // Return full response with metadata
            return {
                hotelSearch: response.data.HotelSearch || [],
                countResults: response.data.CountResults || 0,
                errorMessage: response.data.ErrorMessage || null,
                searchId: response.data.SearchId || null,
                timing: response.data.Timing || null,
                _limitApplied: searchParams.hotels.length > CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH,
                _requestedHotels: searchParams.hotels.length,
                _searchedHotels: limitedHotels.length
            };
        } catch (error) {
            // Cleanup cancel token on error
            this.cancelTokens.delete('hotelSearch');

            // Enhanced error handling with localized messages
            if (error.isCancelled) {
                throw error; // Re-throw cancellation errors as-is
            }

            if (error.isTimeout) {
                const message = typeof this.messages.TIMEOUT === 'function'
                    ? this.messages.TIMEOUT(searchParams.hotels?.length || 0)
                    : `Search timeout for ${searchParams.hotels?.length || 0} hotels`;
                throw new Error(message);
            }

            if (error.isNetworkError) {
                throw new Error(this.messages.NETWORK);
            }

            throw error;
        }
    }

    /**
     * List hotels with enhanced details
     */
    async listHotelEnhanced(cityId = null, options = {}) {
        const {
            batchSize = CONFIG.BATCH.DEFAULT_SIZE,
            delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY,
            onProgress = null,
            onBatchComplete = null
        } = options;

        if (process.env.NODE_ENV === 'development') {
            console.log('📋 Fetching hotel list...');
        }

        const hotelsList = await this.listHotel(cityId);

        if (!hotelsList || hotelsList.length === 0) {
            if (process.env.NODE_ENV === 'development') {
                console.log('❌ No hotels found');
            }
            return [];
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Found ${hotelsList.length} hotels. Starting batch processing...`);
        }

        const enhancedHotels = [];
        const totalBatches = Math.ceil(hotelsList.length / batchSize);

        for (let i = 0; i < hotelsList.length; i += batchSize) {
            const batch = hotelsList.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;

            if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);
            }

            const batchPromises = batch.map(hotel =>
                this.getHotel(hotel.Id)
                    .then(hotelDetail => {
                        const enhanced = this._mergeHotelData(hotel, hotelDetail);
                        if (process.env.NODE_ENV === 'development') {
                            console.log(`✓ Enhanced hotel: ${hotel.Name}`);
                        }
                        return enhanced;
                    })
                    .catch(error => {
                        if (process.env.NODE_ENV === 'development') {
                            console.error(`✗ Error fetching details for hotel ${hotel.Id} (${hotel.Name}):`, error.message);
                        }
                        return {
                            ...hotel,
                            _enhanced: false,
                            _error: error.message
                        };
                    })
            );

            const batchResults = await Promise.all(batchPromises);
            enhancedHotels.push(...batchResults);

            if (onProgress) {
                onProgress(enhancedHotels.length, hotelsList.length);
            }

            if (onBatchComplete) {
                onBatchComplete(currentBatch, totalBatches, batchResults);
            }

            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Batch ${currentBatch}/${totalBatches} completed (Total processed: ${enhancedHotels.length}/${hotelsList.length})`);
            }

            if (i + batchSize < hotelsList.length) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
                }
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`🎉 All batches completed! Enhanced ${enhancedHotels.length} hotels.`);
        }

        return enhancedHotels;
    }

    /**
     * Merge hotel list data with hotel detail data
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
            Id: listHotelData.Id,
            Name: listHotelData.Name,
            Category: {
                Id: listHotelData.Category?.Id,
                Title: hotelDetailData.Category?.Title || listHotelData.Category?.Title,
                Star: hotelDetailData.Category?.Star || listHotelData.Category?.Star
            },
            City: {
                Id: listHotelData.City?.Id,
                Name: listHotelData.City?.Name || hotelDetailData.City?.Name,
                Country: listHotelData.City?.Country || {
                    Name: hotelDetailData.City?.Country
                }
            },
            ShortDescription: listHotelData.ShortDescription,
            Address: listHotelData.Adress || listHotelData.Address,
            Adress: listHotelData.Adress,
            Localization: listHotelData.Localization,
            Facilities: listHotelData.Facilities || [],
            Email: hotelDetailData.Email,
            Phone: hotelDetailData.Phone,
            Vues: hotelDetailData.Vues || [],
            Type: hotelDetailData.Type,
            Album: hotelDetailData.Album || [],
            Tag: hotelDetailData.Tag || [],
            Boarding: hotelDetailData.Boarding || [],
            Image: listHotelData.Image || hotelDetailData.Image,
            Images: hotelDetailData.Album || [listHotelData.Image].filter(Boolean),
            Description: hotelDetailData.Description || listHotelData.ShortDescription,
            Theme: hotelDetailData.Theme || listHotelData.Theme || [],
            Equipments: hotelDetailData.Equipments || listHotelData.Facilities || [],
            _enhanced: true,
            _sourceListHotel: true,
            _sourceHotelDetail: true,
            _mergedAt: new Date().toISOString()
        };
    }

    // ==================== CACHE UTILITIES ====================
    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
        if (process.env.NODE_ENV === 'development') {
            console.log('🗑️ Cache cleared');
        }
    }

    /**
     * Clear specific cache entry
     */
    clearCacheEntry(key) {
        this.cache.delete(key);
        if (process.env.NODE_ENV === 'development') {
            console.log(`🗑️ Cache entry '${key}' cleared`);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
}

// Create and export singleton instance
const apiClient = new ApiClient('en'); // Default to English, can be changed with setLanguage()
export default apiClient;

// Also export the class for testing or multiple instances
export { ApiClient, CONFIG, ERROR_MESSAGES };
