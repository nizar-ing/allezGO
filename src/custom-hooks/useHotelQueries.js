import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import ApiClient from "../services/ApiClient.js";

// ==================== Query Keys ====================
// Centralized for consistency and easy management
export const QUERY_KEYS = {
    countries: ['countries'],
    cities: ['cities'],
    categories: ['categories'],
    tags: ['tags'],
    boardings: ['boardings'],
    currencies: ['currencies'],
    hotels: ['hotels'],
    hotelsByCity: (cityId) => ['hotels', 'city', cityId],
    hotelDetail: (hotelId) => ['hotel', hotelId],
    hotelSearch: (params) => ['hotelSearch', params],
    hotelsBatch: (hotelIds) => ['hotels', 'batch', hotelIds.sort().join(',')],
};

// ==================== Configuration ====================
const QUERY_CONFIG = {
    // Static data that rarely changes
    STATIC: {
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
    },
    // Semi-static data
    SEMI_STATIC: {
        staleTime: 1000 * 60 * 15, // 15 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    },
    // Dynamic data (searches, availability)
    DYNAMIC: {
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    },
};

// ==================== List Queries ====================

/**
 * Fetch all countries
 * Uses ApiClient's internal cache + React Query cache for double caching
 */
export const useCountries = (options = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.countries,
        queryFn: () => ApiClient.listCountry(),
        ...QUERY_CONFIG.STATIC,
        ...options,
    });
};

/**
 * Fetch all cities
 * Uses ApiClient's internal cache + React Query cache
 */
export const useCities = (options = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.cities,
        queryFn: () => ApiClient.listCity(),
        ...QUERY_CONFIG.STATIC,
        ...options,
    });
};

/**
 * Fetch all categories
 * Uses ApiClient's internal cache + React Query cache
 */
export const useCategories = (options = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: () => ApiClient.listCategorie(),
        ...QUERY_CONFIG.STATIC,
        ...options,
    });
};

/**
 * Fetch all tags
 * Uses ApiClient's internal cache + React Query cache
 */
export const useTags = (options = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.tags,
        queryFn: () => ApiClient.listTag(),
        ...QUERY_CONFIG.STATIC,
        ...options,
    });
};

/**
 * Fetch all boarding types
 * Uses ApiClient's internal cache + React Query cache
 */
export const useBoardings = (options = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.boardings,
        queryFn: () => ApiClient.listBoarding(),
        ...QUERY_CONFIG.STATIC,
        ...options,
    });
};

/**
 * Fetch all currencies
 * Uses ApiClient's internal cache + React Query cache
 */
export const useCurrencies = (options = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.currencies,
        queryFn: async () => {
            const data = await ApiClient.listCurrency();
            return data.currencies; // Extract just the currencies array
        },
        ...QUERY_CONFIG.STATIC,
        ...options,
    });
};

// ==================== Hotel Queries ====================

/**
 * Fetch all hotels or hotels filtered by city
 * @param {number|null} cityId - Optional city ID
 * @param {Object} options - Additional React Query options
 */
export const useHotels = (cityId = null, options = {}) => {
    const { enabled = true, ...restOptions } = options;

    return useQuery({
        queryKey: cityId ? QUERY_KEYS.hotelsByCity(cityId) : QUERY_KEYS.hotels,
        queryFn: () => ApiClient.listHotel(cityId),
        enabled: enabled,
        ...QUERY_CONFIG.SEMI_STATIC,
        ...restOptions,
    });
};

/**
 * Fetch multiple hotels by their IDs using batch processing
 * @param {number[]} hotelIds - Array of hotel IDs
 * @param {Object} options - Configuration options
 * @param {number} options.batchSize - Hotels per batch (default: 5)
 * @param {number} options.delayBetweenBatches - Delay between batches in ms (default: 100)
 * @param {boolean} options.enabled - Whether to enable the query
 */
export const useHotelsBatch = (hotelIds = [], options = {}) => {
    const {
        batchSize = 5,
        delayBetweenBatches = 100,
        enabled = true,
        ...restOptions
    } = options;

    return useQuery({
        queryKey: QUERY_KEYS.hotelsBatch(hotelIds),
        queryFn: () => ApiClient.getHotelsBatch(hotelIds, {
            batchSize,
            delayBetweenBatches
        }),
        enabled: enabled && hotelIds.length > 0,
        ...QUERY_CONFIG.SEMI_STATIC,
        refetchOnWindowFocus: false, // Batch operations are expensive
        ...restOptions,
    });
};

/**
 * Fetch enhanced hotels list with full details using batch processing
 * @param {number|null} cityId - Optional city ID
 * @param {Object} options - Fetch options
 */
export const useHotelsEnhanced = (cityId = null, options = {}) => {
    const {
        batchSize = 5,
        delayBetweenBatches = 100,
        enabled = true,
        onProgress = null,
        onBatchComplete = null,
        ...restOptions
    } = options;

    return useQuery({
        queryKey: cityId
            ? [...QUERY_KEYS.hotelsByCity(cityId), 'enhanced']
            : [...QUERY_KEYS.hotels, 'enhanced'],
        queryFn: () => ApiClient.listHotelEnhanced(cityId, {
            batchSize,
            delayBetweenBatches,
            onProgress,
            onBatchComplete
        }),
        enabled: enabled,
        ...QUERY_CONFIG.SEMI_STATIC,
        staleTime: 1000 * 60 * 20, // 20 minutes - enhanced data is expensive
        refetchOnWindowFocus: false, // Disable automatic refetch
        refetchOnMount: false,
        retry: 1, // Only retry once if it fails
        ...restOptions,
    });
};

/**
 * Fetch specific hotel details
 * @param {number} hotelId - Hotel ID
 * @param {Object} options - Additional React Query options
 */
export const useHotelDetail = (hotelId, options = {}) => {
    const { enabled = true, ...restOptions } = options;

    return useQuery({
        queryKey: QUERY_KEYS.hotelDetail(hotelId),
        queryFn: async () => {
            const data = await ApiClient.getHotelDetail(hotelId);

            // Check for errors in the response
            if (data.errorMessage && data.errorMessage.length > 0) {
                throw new Error(data.errorMessage[0]?.Description || 'Failed to fetch hotel details');
            }

            return data.hotelDetail; // Extract just the hotel detail object
        },
        enabled: !!hotelId && enabled, // Only run if hotelId exists
        ...QUERY_CONFIG.SEMI_STATIC,
        ...restOptions,
    });
};

/**
 * Hotel search hook with automatic request cancellation
 * @param {Object} searchParams - Search parameters
 * @param {Object} options - Additional options
 */
export const useHotelSearch = (searchParams, options = {}) => {
    const { enabled = false, ...restOptions } = options;

    // Cancel search on unmount or when params change
    useEffect(() => {
        return () => {
            // Cancel the search request when component unmounts or params change
            ApiClient.cancelRequest('hotelSearch');
        };
    }, [searchParams?.checkIn, searchParams?.checkOut, searchParams?.hotels?.length]);

    return useQuery({
        queryKey: QUERY_KEYS.hotelSearch(searchParams),
        queryFn: async () => {
            try {
                const data = await ApiClient.searchHotel(searchParams);

                // Check for API errors
                if (data.errorMessage && data.errorMessage.Code) {
                    throw new Error(data.errorMessage.Description || 'Search failed');
                }

                return data; // Return full object with metadata
            } catch (error) {
                // Don't throw error if request was cancelled
                if (error.isCancelled) {
                    return null;
                }
                throw error;
            }
        },
        enabled: enabled && !!searchParams?.checkIn && !!searchParams?.checkOut,
        ...QUERY_CONFIG.DYNAMIC,
        retry: (failureCount, error) => {
            // Don't retry if cancelled or client error
            if (error.isCancelled || (error.status >= 400 && error.status < 500)) {
                return false;
            }
            return failureCount < 1; // Only retry once for searches
        },
        ...restOptions,
    });
};

/**
 * Mutation for hotel search (alternative to useHotelSearch for more control)
 * Use this when you want to trigger search manually (e.g., on button click)
 */
export const useHotelSearchMutation = (options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (searchParams) => ApiClient.searchHotel(searchParams),
        onSuccess: (data, variables) => {
            // Cache the search results
            queryClient.setQueryData(QUERY_KEYS.hotelSearch(variables), data);
        },
        retry: (failureCount, error) => {
            if (error.isCancelled || (error.status >= 400 && error.status < 500)) {
                return false;
            }
            return failureCount < 1;
        },
        ...options,
    });
};

// ==================== Helper Hooks ====================

/**
 * Helper hook to get all filter data at once
 * Useful for loading all dropdown options on a search/filter page
 */
export const useFilterData = () => {
    const countries = useCountries();
    const cities = useCities();
    const categories = useCategories();
    const tags = useTags();
    const boardings = useBoardings();
    const currencies = useCurrencies();

    return {
        countries,
        cities,
        categories,
        tags,
        boardings,
        currencies,
        isLoading:
            countries.isLoading ||
            cities.isLoading ||
            categories.isLoading ||
            tags.isLoading ||
            boardings.isLoading ||
            currencies.isLoading,
        isError:
            countries.isError ||
            cities.isError ||
            categories.isError ||
            tags.isError ||
            boardings.isError ||
            currencies.isError,
        error: countries.error ||
            cities.error ||
            categories.error ||
            tags.error ||
            boardings.error ||
            currencies.error,
    };
};

/**
 * Prefetch filter data for better UX
 * Call this early in your app (e.g., in a layout component)
 */
export const usePrefetchFilterData = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Prefetch all filter data
        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.countries,
            queryFn: () => ApiClient.listCountry(),
            ...QUERY_CONFIG.STATIC,
        });

        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.cities,
            queryFn: () => ApiClient.listCity(),
            ...QUERY_CONFIG.STATIC,
        });

        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.categories,
            queryFn: () => ApiClient.listCategorie(),
            ...QUERY_CONFIG.STATIC,
        });

        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.tags,
            queryFn: () => ApiClient.listTag(),
            ...QUERY_CONFIG.STATIC,
        });

        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.boardings,
            queryFn: () => ApiClient.listBoarding(),
            ...QUERY_CONFIG.STATIC,
        });

        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.currencies,
            queryFn: async () => {
                const data = await ApiClient.listCurrency();
                return data.currencies;
            },
            ...QUERY_CONFIG.STATIC,
        });
    }, [queryClient]);
};

/**
 * Helper hook to invalidate hotel-related queries
 * Useful after booking or when you need to refresh hotel data
 */
export const useInvalidateHotels = () => {
    const queryClient = useQueryClient();

    return {
        /**
         * Invalidate all hotel queries
         */
        invalidateAll: useCallback(() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotels });
            // Also clear ApiClient cache
            ApiClient.clearCache();
        }, [queryClient]),

        /**
         * Invalidate hotels for a specific city
         */
        invalidateByCity: useCallback((cityId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotelsByCity(cityId) });
            // Clear specific cache entry
            ApiClient.clearCacheEntry(`hotels_city_${cityId}`);
        }, [queryClient]),

        /**
         * Invalidate a specific hotel detail
         */
        invalidateDetail: useCallback((hotelId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotelDetail(hotelId) });
            // Clear specific cache entry
            ApiClient.clearCacheEntry(`hotel_${hotelId}`);
        }, [queryClient]),

        /**
         * Invalidate all search results
         */
        invalidateSearch: useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['hotelSearch'] });
        }, [queryClient]),

        /**
         * Invalidate all filter data (countries, cities, etc.)
         */
        invalidateFilters: useCallback(() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.countries });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.boardings });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currencies });
            // Clear ApiClient cache for these
            ApiClient.clearCacheEntry('countries');
            ApiClient.clearCacheEntry('cities');
            ApiClient.clearCacheEntry('categories');
            ApiClient.clearCacheEntry('tags');
            ApiClient.clearCacheEntry('boarding');
            ApiClient.clearCacheEntry('currencies');
        }, [queryClient]),
    };
};

/**
 * Hook to manage ApiClient cache alongside React Query cache
 * Useful for debugging and cache management
 */
export const useCacheManager = () => {
    const queryClient = useQueryClient();

    return {
        /**
         * Clear all caches (React Query + ApiClient)
         */
        clearAll: useCallback(() => {
            queryClient.clear();
            ApiClient.clearCache();
            console.log('✅ All caches cleared');
        }, [queryClient]),

        /**
         * Get cache statistics
         */
        getStats: useCallback(() => {
            const apiClientStats = ApiClient.getCacheStats();
            const reactQueryCache = queryClient.getQueryCache().getAll();

            return {
                apiClient: apiClientStats,
                reactQuery: {
                    totalQueries: reactQueryCache.length,
                    activeQueries: reactQueryCache.filter(q => q.state.fetchStatus === 'fetching').length,
                    staleQueries: reactQueryCache.filter(q => q.isStale()).length,
                    queries: reactQueryCache.map(q => ({
                        queryKey: q.queryKey,
                        status: q.state.status,
                        dataUpdatedAt: q.state.dataUpdatedAt,
                    })),
                },
            };
        }, [queryClient]),

        /**
         * Clear ApiClient cache only
         */
        clearApiClientCache: useCallback(() => {
            ApiClient.clearCache();
            console.log('✅ ApiClient cache cleared');
        }, []),

        /**
         * Clear React Query cache only
         */
        clearReactQueryCache: useCallback(() => {
            queryClient.clear();
            console.log('✅ React Query cache cleared');
        }, [queryClient]),
    };
};

/**
 * Hook to set ApiClient language
 * Synchronizes with your app's language state
 */
export const useApiClientLanguage = (language = 'en') => {
    useEffect(() => {
        ApiClient.setLanguage(language);
    }, [language]);
};

/**
 * Hook for optimistic hotel search with debouncing
 * Useful for search-as-you-type functionality
 */
export const useDebouncedHotelSearch = (searchParams, delay = 500) => {
    const [debouncedParams, setDebouncedParams] = React.useState(searchParams);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedParams(searchParams);
        }, delay);

        return () => {
            clearTimeout(handler);
            // Cancel any pending search
            ApiClient.cancelRequest('hotelSearch');
        };
    }, [searchParams, delay]);

    return useHotelSearch(debouncedParams, {
        enabled: !!debouncedParams?.checkIn && !!debouncedParams?.checkOut,
    });
};

// ==================== Export Everything ====================
export default {
    // Query hooks
    useCountries,
    useCities,
    useCategories,
    useTags,
    useBoardings,
    useCurrencies,
    useHotels,
    useHotelsBatch,
    useHotelsEnhanced,
    useHotelDetail,
    useHotelSearch,
    useHotelSearchMutation,

    // Helper hooks
    useFilterData,
    usePrefetchFilterData,
    useInvalidateHotels,
    useCacheManager,
    useApiClientLanguage,
    useDebouncedHotelSearch,

    // Constants
    QUERY_KEYS,
    QUERY_CONFIG,
};
