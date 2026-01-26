import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiClient from "../services/ApiClient.js";

// Query Keys - centralized for consistency
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
};

// ==================== List Queries ====================

export const useCountries = () => {
    return useQuery({
        queryKey: QUERY_KEYS.countries,
        queryFn: () => ApiClient.listCountry(),
        staleTime: 1000 * 60 * 30, // 30 minutes - countries don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useCities = () => {
    return useQuery({
        queryKey: QUERY_KEYS.cities,
        queryFn: () => ApiClient.listCity(),
        staleTime: 1000 * 60 * 30, // 30 minutes - cities don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: () => ApiClient.listCategorie(),
        staleTime: 1000 * 60 * 30, // 30 minutes - categories don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useTags = () => {
    return useQuery({
        queryKey: QUERY_KEYS.tags,
        queryFn: () => ApiClient.listTag(),
        staleTime: 1000 * 60 * 30, // 30 minutes - tags don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useBoardings = () => {
    return useQuery({
        queryKey: QUERY_KEYS.boardings,
        queryFn: () => ApiClient.listBoarding(),
        staleTime: 1000 * 60 * 30, // 30 minutes - boardings don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

export const useCurrencies = () => {
    return useQuery({
        queryKey: QUERY_KEYS.currencies,
        queryFn: async () => {
            const data = await ApiClient.listCurrency();
            return data.currencies; // Extract just the currencies array
        },
        staleTime: 1000 * 60 * 30, // 30 minutes - currencies don't change often
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

// ==================== Hotel Queries ====================

/**
 * Fetch all hotels or hotels filtered by city
 * @param {number|null} cityId - Optional city ID
 * @param {boolean} enabled - Whether to enable the query
 */
export const useHotels = (cityId = null, enabled = true) => {
    return useQuery({
        queryKey: cityId ? QUERY_KEYS.hotelsByCity(cityId) : QUERY_KEYS.hotels,
        queryFn: () => ApiClient.listHotel(cityId),
        enabled: enabled,
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
};


/**
 * Fetch enhanced hotels list with full details using batch processing
 * @param {number|null} cityId - Optional city ID
 * @param {Object} options - Fetch options
 * @param {number} options.batchSize - Hotels per batch (default: 5)
 * @param {number} options.delayBetweenBatches - Delay between batches in ms (default: 100)
 * @param {boolean} enabled - Whether to enable the query
 */
export const useHotelsEnhanced = (cityId = null, options = {}, enabled = true) => {
    const { batchSize = 5, delayBetweenBatches = 100 } = options;

    return useQuery({
        queryKey: cityId
            ? [...QUERY_KEYS.hotelsByCity(cityId), 'enhanced']
            : [...QUERY_KEYS.hotels, 'enhanced'],
        queryFn: () => ApiClient.listHotelEnhanced(cityId, {
            batchSize,
            delayBetweenBatches
        }),
        enabled: enabled,
        staleTime: 1000 * 60 * 15, // 15 minutes - enhanced data is expensive
        gcTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false, // Disable automatic refetch
        refetchOnMount: false,
        retry: 1, // Only retry once if it fails
    });
};

/**
 * Fetch specific hotel details
 * @param {number} hotelId - Hotel ID
 * @param {boolean} enabled - Whether to enable the query
 */
export const useHotelDetail = (hotelId, enabled = true) => {
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
        staleTime: 1000 * 60 * 15, // 15 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
};

/**
 * Hotel search with complex parameters using useQuery
 * @param {Object} searchParams - Search parameters
 * @param {boolean} enabled - Whether to enable the query
 */
export const useHotelSearch = (searchParams, enabled = false) => {
    return useQuery({
        queryKey: QUERY_KEYS.hotelSearch(searchParams),
        queryFn: async () => {
            const data = await ApiClient.searchHotel(searchParams);

            // Check for API errors
            if (data.errorMessage && data.errorMessage.Code) {
                throw new Error(data.errorMessage.Description || 'Search failed');
            }

            return data; // Return full object with metadata
        },
        enabled: enabled && !!searchParams?.checkIn && !!searchParams?.checkOut,
        staleTime: 1000 * 60 * 2, // 2 minutes for search results
        gcTime: 1000 * 60 * 5, // 5 minutes
        retry: 1, // Only retry once for searches
    });
};

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
    };
};

/**
 * Helper hook to invalidate hotel-related queries
 * Useful after booking or when you need to refresh hotel data
 */
export const useInvalidateHotels = () => {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotels });
        },
        invalidateByCity: (cityId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotelsByCity(cityId) });
        },
        invalidateDetail: (hotelId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotelDetail(hotelId) });
        },
        invalidateSearch: () => {
            queryClient.invalidateQueries({ queryKey: ['hotelSearch'] });
        },
    };
};
