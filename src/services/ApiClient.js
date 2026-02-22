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
        BOARDING_TYPE_INVALID: 'Invalid boarding type. Must be one of: RO, BB, HB, FB, AI, SC',
        INVALID_DATE_RANGE: 'Check-out date must be after check-in date',
        NO_ROOMS_AVAILABLE: 'No rooms available for the selected dates and criteria',
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
        BOARDING_TYPE_INVALID: 'Type de pension invalide. Doit être: RO, BB, HB, FB, AI, SC',
        INVALID_DATE_RANGE: 'La date de départ doit être après la date d\'arrivée',
        NO_ROOMS_AVAILABLE: 'Aucune chambre disponible pour les dates et critères sélectionnés',
    }
};

// ==================== CACHE MANAGER ====================
class CacheManager {
    constructor(ttl = CONFIG.CACHE.TTL) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, { value, timestamp: Date.now() });
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

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// ==================== API CLIENT ====================
class ApiClient {
    constructor(language = 'en') {
        this.language = language;
        this.messages = ERROR_MESSAGES[language] || ERROR_MESSAGES.en;

        this.client = axios.create({
            baseURL: CONFIG.BASE_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: CONFIG.TIMEOUT.DEFAULT,
        });

        this.credentials = CREDENTIALS;
        this.cache = new CacheManager(CONFIG.CACHE.TTL);
        this.cancelTokens = new Map();

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
        this.client.interceptors.request.use(
            (config) => {
                if (import.meta.env.DEV) {
                    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.client.interceptors.response.use(
            (response) => {
                if (import.meta.env.DEV) {
                    console.log('API Response:', response.status);
                }
                return response;
            },
            (error) => {
                if (axios.isCancel(error)) {
                    if (import.meta.env.DEV) {
                        console.log('Request cancelled:', error.message);
                    }
                    return Promise.reject({
                        message: 'Request cancelled',
                        isCancelled: true,
                        timestamp: new Date().toISOString(),
                    });
                }

                const apiError = {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    isNetworkError: !error.response,
                    isTimeout: error.code === 'ECONNABORTED',
                    timestamp: new Date().toISOString(),
                };

                if (import.meta.env.DEV) {
                    if (error.code === 'ECONNABORTED') {
                        console.error('⏱️ Request timeout - server took too long to respond');
                    } else if (error.response) {
                        console.error('API Error:', error.response.status, error.response.data);
                        switch (error.response.status) {
                            case 401: console.error(this.messages.UNAUTHORIZED); break;
                            case 404: console.error(this.messages.NOT_FOUND);    break;
                            case 500: console.error(this.messages.SERVER_ERROR); break;
                            default:  console.error(this.messages.REQUEST_FAILED);
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
    async retryRequest(requestFn, maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;

                if (error.isCancelled) throw error;

                const shouldNotRetry =
                    error.status >= 400 &&
                    error.status < 500 &&
                    error.status !== 408 &&
                    error.status !== 429;

                if (shouldNotRetry) throw error;
                if (attempt === maxAttempts) break;
                if (!this.isRetryableError(error)) throw error;

                const delay = Math.min(
                    CONFIG.RETRY.BASE_DELAY * Math.pow(2, attempt - 1),
                    CONFIG.RETRY.MAX_DELAY
                );

                if (import.meta.env.DEV) {
                    console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        if (import.meta.env.DEV) {
            console.error(`❌ All ${maxAttempts} retry attempts failed`);
        }
        throw lastError;
    }

    isRetryableError(error) {
        if (error.isNetworkError) return true;
        if (error.isTimeout)      return true;
        if (error.status >= 500)  return true;
        if (error.status === 408 || error.status === 429) return true;
        return false;
    }

    // ==================== CANCEL TOKEN MANAGEMENT ====================
    createCancelToken(key) {
        this.cancelRequest(key);
        const source = axios.CancelToken.source();
        this.cancelTokens.set(key, source);
        return source;
    }

    cancelRequest(key) {
        const source = this.cancelTokens.get(key);
        if (source) {
            source.cancel(`Request ${key} cancelled`);
            this.cancelTokens.delete(key);
        }
    }

    cancelAllRequests() {
        this.cancelTokens.forEach((source) => source.cancel('All requests cancelled'));
        this.cancelTokens.clear();
    }

    // ==================== HELPER METHODS ====================
    createRequestBody(additionalData = {}) {
        return {
            Credential: this.credentials,
            ...additionalData,
        };
    }

    // ==================== CACHED LIST ENDPOINTS ====================
    async listCountry() {
        const cacheKey = 'countries';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log('✅ Using cached countries');
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCountry', this.createRequestBody());
            return response.data.ListCountry || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listCity() {
        const cacheKey = 'cities';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log('✅ Using cached cities');
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCity', this.createRequestBody());
            return response.data.ListCity || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listCategorie() {
        const cacheKey = 'categories';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log('✅ Using cached categories');
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCategorie', this.createRequestBody());
            return response.data.ListCategorie || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listTag() {
        const cacheKey = 'tags';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log('✅ Using cached tags');
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListTag', this.createRequestBody());
            return response.data.ListTag || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listBoarding() {
        const cacheKey = 'boarding';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log('✅ Using cached boarding options');
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListBoarding', this.createRequestBody());
            return response.data.ListBoarding || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listCurrency() {
        const cacheKey = 'currencies';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log('✅ Using cached currencies');
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCurrency', this.createRequestBody());
            return {
                currencies:   response.data.ListCurrency  || [],
                countResults: response.data.CountResults  || 0,
                errorMessage: response.data.ErrorMessage  || [],
                timing:       response.data.Timing        || null,
            };
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    // ==================== HOTEL ENDPOINTS ====================
    async listHotel(cityId = null) {
        const cacheKey = cityId ? `hotels_city_${cityId}` : 'hotels_all';
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log(`✅ Using cached hotel list (${cacheKey})`);
                return cached;
            }
        }
        const data = await this.retryRequest(async () => {
            const requestBody = cityId
                ? this.createRequestBody({ City: cityId })
                : this.createRequestBody();
            const response = await this.client.post('/ListHotel', requestBody);
            return response.data.ListHotel || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async getHotel(hotelId) {
        if (!hotelId) throw new Error(this.messages.HOTEL_ID_REQUIRED);

        const cacheKey = `hotel_${hotelId}`;
        if (CONFIG.CACHE.ENABLED) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (import.meta.env.DEV) console.log(`✅ Using cached hotel detail (${hotelId})`);
                return cached;
            }
        }

        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/HotelDetail',
                this.createRequestBody({ Hotel: hotelId })
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

        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async getHotelDetail(hotelId) {
        if (!hotelId) throw new Error(this.messages.HOTEL_ID_REQUIRED);

        return await this.retryRequest(async () => {
            const response = await this.client.post('/HotelDetail',
                this.createRequestBody({ Hotel: hotelId })
            );
            return {
                hotelDetail:  response.data.HotelDetail  || null,
                errorMessage: response.data.ErrorMessage || [],
                timing:       response.data.Timing       || null,
            };
        });
    }

    async getHotelsBatch(hotelIds = [], options = {}) {
        if (!Array.isArray(hotelIds) || hotelIds.length === 0) return {};

        const {
            batchSize = CONFIG.BATCH.DEFAULT_SIZE,
            delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY,
        } = options;

        if (import.meta.env.DEV) {
            console.log(`🔄 Fetching ${hotelIds.length} hotels in batches of ${batchSize}...`);
        }

        const hotelsMap = {};
        const totalBatches = Math.ceil(hotelIds.length / batchSize);

        for (let i = 0; i < hotelIds.length; i += batchSize) {
            const batch = hotelIds.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;

            if (import.meta.env.DEV) {
                console.log(`📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);
            }

            const batchPromises = batch.map(id =>
                this.getHotel(id)
                    .then(hotel => ({ id, hotel, success: true }))
                    .catch(error => {
                        if (import.meta.env.DEV) {
                            console.error(`❌ Failed to fetch hotel ${id}:`, error.message);
                        }
                        return { id, hotel: null, success: false, error: error.message };
                    })
            );

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(result => {
                if (result.success && result.hotel) hotelsMap[result.id] = result.hotel;
            });

            if (import.meta.env.DEV) {
                console.log(`✅ Batch ${currentBatch}/${totalBatches} completed`);
            }

            if (i + batchSize < hotelIds.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        if (import.meta.env.DEV) {
            console.log(`✨ Fetched ${Object.keys(hotelsMap).length}/${hotelIds.length} hotels successfully`);
        }

        return hotelsMap;
    }

    async searchHotel(searchParams = {}) {
        const cancelToken = this.createCancelToken('hotelSearch');

        try {
            if (!searchParams.checkIn)  throw new Error(this.messages.CHECKIN_REQUIRED);
            if (!searchParams.checkOut) throw new Error(this.messages.CHECKOUT_REQUIRED);
            if (!searchParams.hotels || !Array.isArray(searchParams.hotels) || searchParams.hotels.length === 0)
                throw new Error(this.messages.HOTELS_REQUIRED);
            if (!searchParams.rooms || !Array.isArray(searchParams.rooms) || searchParams.rooms.length === 0)
                throw new Error(this.messages.ROOMS_REQUIRED);

            const limitedHotels = searchParams.hotels.slice(0, CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH);

            if (searchParams.hotels.length > CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH) {
                console.warn(`⚠️ Hotel search limited to ${CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH} hotels (requested: ${searchParams.hotels.length})`);
            }

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

            const bookingDetails = {
                CheckIn:  searchParams.checkIn,
                CheckOut: searchParams.checkOut,
                Hotels:   limitedHotels,
            };

            const filters = searchParams.filters || {};
            const searchFilters = {
                Keywords:      filters.keywords     || "",
                Category:      filters.category     || [],
                OnlyAvailable: filters.onlyAvailable !== undefined ? filters.onlyAvailable : true,
                Tags:          filters.tags         || [],
            };

            const rooms = searchParams.rooms.map(room => {
                const roomObj = { Adult: room.adult || room.Adult || 2 };
                if (room.child && Array.isArray(room.child) && room.child.length > 0) {
                    roomObj.Child = room.child;
                } else if (room.Child && Array.isArray(room.Child) && room.Child.length > 0) {
                    roomObj.Child = room.Child;
                }
                return roomObj;
            });

            const requestBody = this.createRequestBody({
                SearchDetails: {
                    BookingDetails: bookingDetails,
                    Filters: searchFilters,
                    Rooms: rooms,
                }
            });

            if (import.meta.env.DEV) {
                console.log(`🔍 Searching ${limitedHotels.length} hotels...`);
                console.log(`📦 Request size: ${(JSON.stringify(requestBody).length / 1024).toFixed(2)} KB`);
            }

            const response = await this.retryRequest(async () => {
                return await this.client.post('/HotelSearch', requestBody, {
                    timeout: CONFIG.TIMEOUT.SEARCH,
                    cancelToken: cancelToken.token,
                });
            });

            if (import.meta.env.DEV) {
                console.log(`✅ Search returned ${response.data.HotelSearch?.length || 0} results`);
            }

            this.cancelTokens.delete('hotelSearch');

            return {
                hotelSearch:      response.data.HotelSearch  || [],
                countResults:     response.data.CountResults || 0,
                errorMessage:     response.data.ErrorMessage || null,
                searchId:         response.data.SearchId     || null,
                timing:           response.data.Timing       || null,
                _limitApplied:    searchParams.hotels.length > CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH,
                _requestedHotels: searchParams.hotels.length,
                _searchedHotels:  limitedHotels.length,
            };

        } catch (error) {
            this.cancelTokens.delete('hotelSearch');

            if (error.isCancelled) throw error;

            if (error.isTimeout) {
                const message = typeof this.messages.TIMEOUT === 'function'
                    ? this.messages.TIMEOUT(searchParams.hotels?.length || 0)
                    : `Search timeout for ${searchParams.hotels?.length || 0} hotels`;
                throw new Error(message);
            }

            if (error.isNetworkError) throw new Error(this.messages.NETWORK);

            throw error;
        }
    }

    /**
     * Search for room availability and pricing for a specific hotel.
     * @param {Object}  params
     * @param {number}  params.hotelId        - Hotel ID
     * @param {string}  params.checkIn        - YYYY-MM-DD
     * @param {string}  params.checkOut       - YYYY-MM-DD
     * @param {Array}   params.rooms          - [{ adults, children, childAges? }]
     * @param {string}  [params.boardingType] - e.g. 'BB', 'HB' — omit to get ALL
     */
    async searchRoomAvailability(params = {}) {
        const cancelToken = this.createCancelToken('roomAvailability');

        try {
            // ── Validation ────────────────────────────────────────────────────
            if (!params.hotelId) throw new Error(this.messages.HOTEL_ID_REQUIRED);
            if (!params.checkIn)  throw new Error(this.messages.CHECKIN_REQUIRED);
            if (!params.checkOut) throw new Error(this.messages.CHECKOUT_REQUIRED);
            if (!params.rooms || !Array.isArray(params.rooms) || params.rooms.length === 0)
                throw new Error(this.messages.ROOMS_REQUIRED);

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(params.checkIn)) {
                throw new Error(
                    typeof this.messages.INVALID_DATE_FORMAT === 'function'
                        ? this.messages.INVALID_DATE_FORMAT('checkIn')
                        : 'checkIn must be in YYYY-MM-DD format'
                );
            }
            if (!dateRegex.test(params.checkOut)) {
                throw new Error(
                    typeof this.messages.INVALID_DATE_FORMAT === 'function'
                        ? this.messages.INVALID_DATE_FORMAT('checkOut')
                        : 'checkOut must be in YYYY-MM-DD format'
                );
            }

            const checkInDate  = new Date(params.checkIn);
            const checkOutDate = new Date(params.checkOut);
            if (checkOutDate <= checkInDate) throw new Error(this.messages.INVALID_DATE_RANGE);

            // ── Build request ─────────────────────────────────────────────────
            const bookingDetails = {
                CheckIn:  params.checkIn,
                CheckOut: params.checkOut,
                Hotels:   [params.hotelId], // ✅ Fix #1 — always an array
            };

            const rooms = params.rooms.map(room => {
                const roomObj = { Adult: room.adults ?? 2 };
                if (room.children && room.children > 0) {
                    roomObj.Child = room.childAges ?? Array(room.children).fill(5);
                }
                return roomObj;
            });

            const searchFilters = {
                Keywords:      "",
                Category:      [],
                OnlyAvailable: true,
                Tags:          [],
            };

            // Optional: filter by boarding type (omit to return ALL options)
            if (params.boardingType) {
                searchFilters.Boarding = [params.boardingType];
            }

            const requestBody = this.createRequestBody({
                SearchDetails: {
                    BookingDetails: bookingDetails,
                    Filters:        searchFilters,
                    Rooms:          rooms,
                }
            });

            if (import.meta.env.DEV) {
                console.log(`🔍 Room availability — hotel ${params.hotelId}`);
                console.log(`📅 ${params.checkIn} → ${params.checkOut}`);
                console.log(`🛏️  ${rooms.length} room(s)`);
                if (params.boardingType) console.log(`🍽️  Boarding: ${params.boardingType}`);
            }

            // ── API call ──────────────────────────────────────────────────────
            const response = await this.retryRequest(async () => {
                return await this.client.post('/HotelSearch', requestBody, {
                    timeout:     CONFIG.TIMEOUT.SEARCH,
                    cancelToken: cancelToken.token,
                });
            });

            this.cancelTokens.delete('roomAvailability');

            const hotelResults = response.data.HotelSearch || [];

            // ── Fix #2: empty results ─────────────────────────────────────────
            if (hotelResults.length === 0) {
                if (import.meta.env.DEV) console.log('❌ No availability found for the specified dates');
                return {
                    rooms:        [],
                    errorMessage: [this.messages.NO_ROOMS_AVAILABLE],
                    hotelInfo:    null,
                };
            }

            const hotelResult = hotelResults[0];

            // ── Fix #3: real API uses Price.Boarding[], not .Rooms[] ──────────
            if (!hotelResult.Price?.Boarding?.length) {
                if (import.meta.env.DEV) console.log('⚠️ Hotel found but no boarding/pricing data');
                return {
                    rooms: [],
                    errorMessage: ['Aucune chambre disponible pour les dates et critères sélectionnés'],
                    hotelInfo: {
                        hotelId:   hotelResult.Hotel?.Id,
                        hotelName: hotelResult.Hotel?.Name,
                        available: false,
                    },
                };
            }

            // ── Process ───────────────────────────────────────────────────────
            const processedRooms = this._processRoomResults(hotelResult, params.boardingType);

            if (import.meta.env.DEV) {
                console.log(`✅ Found ${processedRooms.length} room option(s)`);
            }

            return {
                rooms:        processedRooms,
                errorMessage: response.data.ErrorMessage || [],
                hotelInfo: {
                    hotelId:    hotelResult.Hotel?.Id,
                    hotelName:  hotelResult.Hotel?.Name,
                    available:  true,
                    totalRooms: processedRooms.length,
                },
                searchId: response.data.SearchId || null,
                timing:   response.data.Timing   || null,
            };

        } catch (error) {
            this.cancelTokens.delete('roomAvailability');

            if (error.isCancelled) throw error;
            if (error.isTimeout)
                throw new Error('Room availability search timed out. Please try again.');
            if (error.isNetworkError)
                throw new Error(this.messages.NETWORK);

            if (import.meta.env.DEV) {
                console.error('❌ Room availability error:', error.message);
            }

            throw error;
        }
    }

    /**
     * Parse real API response: Price.Boarding[].Pax[].Rooms[]
     * @private
     */
    _processRoomResults(hotelResult, boardingType = null) {
        const rooms = [];

        hotelResult.Price?.Boarding?.forEach((boarding, boardingIndex) => {
            const boardingCode = boarding.Code || boarding.BoardingCode;
            const boardingName = boarding.Name || boarding.BoardingName
                || this._getBoardingName(boardingCode);

            // Skip if a specific boarding type was requested and this isn't it
            if (boardingType && boardingCode !== boardingType) return;

            boarding.Pax?.forEach((pax, paxIndex) => {
                pax.Rooms?.forEach((room, roomIndex) => {
                    const roomCode = room.RoomCode || room.Code || `room_${roomIndex}`;
                    const roomName = room.RoomName || room.Name || 'Chambre Standard';

                    rooms.push({
                        id:          `${hotelResult.Hotel?.Id}_${boardingIndex}_${paxIndex}_${roomIndex}_${roomCode}_${boardingCode}`,
                        roomCode,
                        name:        roomName,
                        boardingCode,
                        boardingName,
                        price:       parseFloat(room.Price) || 0,
                        currency:    hotelResult.Currency   || 'DZD',
                        available:   true,
                        _raw:        room,
                    });
                });
            });
        });

        // Sort cheapest first
        rooms.sort((a, b) => a.price - b.price);

        return rooms;
    }

    /**
     * Fallback boarding label from code.
     * @private
     */
    _getBoardingName(code) {
        const boardingMap = {
            'RO': 'Room Only',
            'BB': 'Bed & Breakfast',
            'HB': 'Half Board',
            'FB': 'Full Board',
            'AI': 'All Inclusive',
            'SC': 'Self Catering',
        };
        return boardingMap[code] || code;
    }

    /**
     * Cancel an in-progress room availability search.
     */
    cancelRoomAvailabilitySearch() {
        this.cancelRequest('roomAvailability');
        if (import.meta.env.DEV) {
            console.log('🚫 Room availability search cancelled');
        }
    }

    // ==================== LIST HOTELS ENHANCED ====================
    async listHotelEnhanced(cityId = null, options = {}) {
        const {
            batchSize = CONFIG.BATCH.DEFAULT_SIZE,
            delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY,
            onProgress = null,
            onBatchComplete = null,
        } = options;

        if (import.meta.env.DEV) console.log('📋 Fetching hotel list...');

        const hotelsList = await this.listHotel(cityId);

        if (!hotelsList || hotelsList.length === 0) {
            if (import.meta.env.DEV) console.log('❌ No hotels found');
            return [];
        }

        if (import.meta.env.DEV) {
            console.log(`✅ Found ${hotelsList.length} hotels. Starting batch processing...`);
        }

        const enhancedHotels = [];
        const totalBatches = Math.ceil(hotelsList.length / batchSize);

        for (let i = 0; i < hotelsList.length; i += batchSize) {
            const batch = hotelsList.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;

            if (import.meta.env.DEV) {
                console.log(`🔄 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);
            }

            const batchPromises = batch.map(hotel =>
                this.getHotel(hotel.Id)
                    .then(hotelDetail => {
                        const enhanced = this._mergeHotelData(hotel, hotelDetail);
                        if (import.meta.env.DEV) console.log(`✓ Enhanced: ${hotel.Name}`);
                        return enhanced;
                    })
                    .catch(error => {
                        if (import.meta.env.DEV) {
                            console.error(`✗ Error for hotel ${hotel.Id} (${hotel.Name}):`, error.message);
                        }
                        return { ...hotel, _enhanced: false, _error: error.message };
                    })
            );

            const batchResults = await Promise.all(batchPromises);
            enhancedHotels.push(...batchResults);

            if (onProgress)     onProgress(enhancedHotels.length, hotelsList.length);
            if (onBatchComplete) onBatchComplete(currentBatch, totalBatches, batchResults);

            if (import.meta.env.DEV) {
                console.log(`✅ Batch ${currentBatch}/${totalBatches} done (${enhancedHotels.length}/${hotelsList.length})`);
            }

            if (i + batchSize < hotelsList.length) {
                if (import.meta.env.DEV) console.log(`⏳ Waiting ${delayBetweenBatches}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        if (import.meta.env.DEV) {
            console.log(`🎉 All batches done! Enhanced ${enhancedHotels.length} hotels.`);
        }

        return enhancedHotels;
    }

    _mergeHotelData(listHotelData, hotelDetailData) {
        if (!hotelDetailData) {
            return {
                ...listHotelData,
                _enhanced:          false,
                _sourceListHotel:   true,
                _sourceHotelDetail: false,
            };
        }

        return {
            Id:   listHotelData.Id,
            Name: listHotelData.Name,
            Category: {
                Id:    listHotelData.Category?.Id,
                Title: hotelDetailData.Category?.Title || listHotelData.Category?.Title,
                Star:  hotelDetailData.Category?.Star  || listHotelData.Category?.Star,
            },
            City: {
                Id:      listHotelData.City?.Id,
                Name:    listHotelData.City?.Name    || hotelDetailData.City?.Name,
                Country: listHotelData.City?.Country || { Name: hotelDetailData.City?.Country },
            },
            ShortDescription: listHotelData.ShortDescription,
            Address:          listHotelData.Adress   || listHotelData.Address,
            Adress:           listHotelData.Adress,
            Localization:     listHotelData.Localization,
            Facilities:       listHotelData.Facilities  || [],
            Email:            hotelDetailData.Email,
            Phone:            hotelDetailData.Phone,
            Vues:             hotelDetailData.Vues       || [],
            Type:             hotelDetailData.Type,
            Album:            hotelDetailData.Album      || [],
            Tag:              hotelDetailData.Tag        || [],
            Boarding:         hotelDetailData.Boarding   || [],
            Image:            listHotelData.Image        || hotelDetailData.Image,
            Images:           hotelDetailData.Album      || [listHotelData.Image].filter(Boolean),
            Description:      hotelDetailData.Description || listHotelData.ShortDescription,
            Theme:            hotelDetailData.Theme      || listHotelData.Theme      || [],
            Equipments:       hotelDetailData.Equipments || listHotelData.Facilities || [],
            _enhanced:          true,
            _sourceListHotel:   true,
            _sourceHotelDetail: true,
            _mergedAt:          new Date().toISOString(),
        };
    }

    // ==================== CACHE UTILITIES ====================
    clearCache() {
        this.cache.clear();
        if (import.meta.env.DEV) console.log('🗑️ Cache cleared');
    }

    clearCacheEntry(key) {
        this.cache.delete(key);
        if (import.meta.env.DEV) console.log(`🗑️ Cache entry '${key}' cleared`);
    }

    getCacheStats() {
        return this.cache.getStats();
    }
}

// ==================== SINGLETON EXPORT ====================
const apiClient = new ApiClient('en');
export default apiClient;
export { ApiClient, CONFIG, ERROR_MESSAGES };
