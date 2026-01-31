import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Users, Moon, ArrowLeft, AlertTriangle, ChevronDown } from "lucide-react";
import HotelsListView from "../ui/HotelsListView.jsx";
import Loader from "../ui/Loader.jsx";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import apiClient from "../services/ApiClient";

/**
 * HotelsSearchResultsPage - Enhanced with infinite scrolling
 * Features:
 * - Handles large dataset handling gracefully
 * - Infinite scroll pagination (6 hotels per page)
 * - Uses sessionStorage for large data instead of location.state
 * - Optimized rendering performance
 */
function HotelsSearchResultsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Try to get data from location.state first
    const stateData = location.state;

    // Parse URL params as fallback
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const roomsParam = searchParams.get('rooms');

    // Handle hotel IDs - could be very long
    const hotelIdsParam = searchParams.get('hotelIds');
    const hotelIds = useMemo(() => {
        if (!hotelIdsParam) return null;
        try {
            // Split and filter valid numbers
            return hotelIdsParam.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        } catch (error) {
            console.error('Error parsing hotel IDs:', error);
            return null;
        }
    }, [hotelIdsParam]);

    // Parse rooms data
    const rooms = useMemo(() => {
        try {
            return JSON.parse(roomsParam || '[]');
        } catch {
            return [];
        }
    }, [roomsParam]);

    // State for search data
    const [searchData, setSearchData] = useState(null);
    const [dataLoadError, setDataLoadError] = useState(null);

    // Ref for intersection observer
    const loadMoreRef = useRef(null);

    // Items per page for infinite scroll
    const HOTELS_PER_PAGE = 6;

    // ==================== Load data from sessionStorage if needed ====================
    useEffect(() => {
        try {
            // Priority: location.state > sessionStorage > fetch from API
            if (stateData) {
                // Check if data is too large (> 1MB)
                const dataSize = JSON.stringify(stateData).length;
                if (dataSize > 1048576) { // 1MB
                    console.warn('⚠️ Large dataset detected, moving to sessionStorage');
                    // Store in sessionStorage for large datasets
                    const searchId = `search_${Date.now()}`;
                    sessionStorage.setItem(searchId, JSON.stringify(stateData));
                    sessionStorage.setItem('current_search_id', searchId);
                }
                setSearchData(stateData);
            } else {
                // Try to load from sessionStorage
                const currentSearchId = sessionStorage.getItem('current_search_id');
                if (currentSearchId) {
                    const storedData = sessionStorage.getItem(currentSearchId);
                    if (storedData) {
                        try {
                            const parsed = JSON.parse(storedData);
                            console.log('✅ Loaded data from sessionStorage');
                            setSearchData(parsed);
                        } catch (error) {
                            console.error('Failed to parse stored data:', error);
                            setDataLoadError('Données corrompues dans le cache');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading search data:', error);
            setDataLoadError('Erreur lors du chargement des données');
        }
    }, [stateData]);

    // ==================== STEP 1: Fetch Hotel Details (with size limit) ====================
    const {
        data: hotelsDetailsData,
        isLoading: isLoadingDetails,
        isError: isErrorDetails,
        error: errorDetails
    } = useQuery({
        queryKey: ['hotelDetailsForSearch', hotelIds],
        queryFn: async () => {
            if (!hotelIds || hotelIds.length === 0) {
                return { hotelsMap: {}, count: 0 };
            }

            // Limit to prevent overwhelming the system
            const MAX_HOTELS = 100;
            const limitedHotelIds = hotelIds.slice(0, MAX_HOTELS);

            if (hotelIds.length > MAX_HOTELS) {
                console.warn(`⚠️ Too many hotels (${hotelIds.length}), limiting to ${MAX_HOTELS}`);
            }

            if (process.env.NODE_ENV === 'development') {
                console.log(`📋 Fetching details for ${limitedHotelIds.length} hotels...`);
            }

            // Use batch fetching with smaller batches for large datasets
            const batchSize = limitedHotelIds.length > 50 ? 3 : 5;

            const hotelsMap = await apiClient.getHotelsBatch(limitedHotelIds, {
                batchSize: batchSize,
                delayBetweenBatches: 150
            });

            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Fetched details for ${Object.keys(hotelsMap).length} hotels`);
            }

            return {
                hotelsMap,
                count: Object.keys(hotelsMap).length,
                limited: hotelIds.length > MAX_HOTELS
            };
        },
        enabled: !searchData && !!hotelIds && hotelIds.length > 0,
        staleTime: 5 * 60 * 1000,
        retry: 1
    });

    // ==================== STEP 2: Search Hotels & Merge Data (with optimizations) ====================
    const { data: fetchedData, isLoading: isLoadingSearch, isError, error } = useQuery({
        queryKey: ['hotelSearch', hotelIds, checkIn, checkOut, rooms],
        queryFn: async () => {
            if (!hotelIds || hotelIds.length === 0) {
                throw new Error("Aucun hôtel spécifié");
            }

            if (!checkIn || !checkOut) {
                throw new Error("Dates de séjour manquantes");
            }

            if (!rooms || rooms.length === 0) {
                throw new Error("Informations sur les chambres manquantes");
            }

            // Limit hotels for API call
            const MAX_SEARCH_HOTELS = 100;
            const searchHotelIds = hotelIds.slice(0, MAX_SEARCH_HOTELS);

            if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 Searching ${searchHotelIds.length} hotels with pricing...`);
            }

            // Search for hotels (gets pricing + availability)
            const result = await apiClient.searchHotel({
                checkIn,
                checkOut,
                hotels: searchHotelIds,
                rooms: rooms.map(room => ({
                    adult: room.adults,
                    child: room.children && room.children.length > 0 ? room.children : undefined
                })),
                filters: {
                    keywords: "",
                    category: [],
                    onlyAvailable: true,
                    tags: []
                }
            });

            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Search returned ${result.hotelSearch?.length || 0} hotels`);
            }

            // Get the hotels details map
            const hotelsMap = hotelsDetailsData?.hotelsMap || {};

            // Merge search results with full details (optimized)
            const enrichedResults = result.hotelSearch.map(searchResult => {
                const hotelFromSearch = searchResult.Hotel;
                const fullDetails = hotelsMap[hotelFromSearch.Id];

                // Calculate min/max prices from boarding options (optimized)
                let minPrice = null;
                let maxPrice = null;

                if (searchResult.Price?.Boarding && Array.isArray(searchResult.Price.Boarding)) {
                    const allPrices = [];

                    for (const boarding of searchResult.Price.Boarding) {
                        if (!boarding.Pax) continue;

                        for (const pax of boarding.Pax) {
                            if (!pax.Rooms) continue;

                            for (const room of pax.Rooms) {
                                if (room.Price) {
                                    const price = parseFloat(room.Price);
                                    if (!isNaN(price)) {
                                        allPrices.push(price);
                                    }
                                }
                            }
                        }
                    }

                    if (allPrices.length > 0) {
                        minPrice = Math.min(...allPrices);
                        maxPrice = Math.max(...allPrices);
                    }
                }

                // Merge: full details + search result (only essential data)
                const enrichedHotel = {
                    // Core Information
                    Id: hotelFromSearch.Id,
                    Name: fullDetails?.Name || hotelFromSearch.Name,

                    // Category
                    Category: fullDetails?.Category || hotelFromSearch.Category,

                    // Location
                    City: fullDetails?.City || hotelFromSearch.City,
                    Address: fullDetails?.Adress || fullDetails?.Address || hotelFromSearch.Adress,
                    Adress: fullDetails?.Adress || hotelFromSearch.Adress,
                    Localization: fullDetails?.Localization || hotelFromSearch.Localization,

                    // Descriptions (keep short for large datasets)
                    ShortDescription: fullDetails?.ShortDescription || hotelFromSearch.ShortDescription,

                    // Images (limit to essential)
                    Image: fullDetails?.Image || hotelFromSearch.Image,
                    Album: fullDetails?.Album || [],

                    // Facilities & Features (limit to first 10 for performance)
                    Facilities: (fullDetails?.Facilities || []).slice(0, 10),
                    Theme: (fullDetails?.Theme || hotelFromSearch.Theme || []).slice(0, 5),

                    // Pricing from search results
                    MinPrice: minPrice,
                    MaxPrice: maxPrice,
                    Currency: searchResult.Currency,

                    // Keep essential search data only (not full PriceDetails for list view)
                    Token: searchResult.Token,
                    Recommended: searchResult.Recommended,

                    // Metadata
                    _hasFullDetails: !!fullDetails,
                };

                return {
                    Hotel: enrichedHotel,
                    Token: searchResult.Token,
                    // Store full price details reference but don't include in Hotel object
                    _fullPriceDetails: searchResult.Price,
                    Tarif: searchResult.Tarif || searchResult.Price,
                };
            });

            if (process.env.NODE_ENV === 'development') {
                console.log(`✨ Enriched ${enrichedResults.length} hotels with full details`);

                // Log data quality and size
                const withFullDetails = enrichedResults.filter(r => r.Hotel._hasFullDetails).length;
                console.log(`📊 ${withFullDetails}/${enrichedResults.length} hotels have full details`);

                // Check data size
                const dataSize = JSON.stringify(enrichedResults).length;
                console.log(`💾 Response data size: ${(dataSize / 1024).toFixed(2)} KB`);
            }

            const finalData = {
                searchResults: enrichedResults,
                searchId: result.searchId,
                countResults: result.countResults,
                searchCriteria: {
                    checkIn,
                    checkOut,
                    rooms,
                    nights: Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
                }
            };

            // Store in sessionStorage if data is large
            const finalDataSize = JSON.stringify(finalData).length;
            if (finalDataSize > 524288) { // 512KB
                const searchId = `search_${Date.now()}`;
                try {
                    sessionStorage.setItem(searchId, JSON.stringify(finalData));
                    sessionStorage.setItem('current_search_id', searchId);
                    console.log('✅ Large dataset stored in sessionStorage');
                } catch (storageError) {
                    console.error('Failed to store in sessionStorage:', storageError);
                }
            }

            return finalData;
        },
        enabled: !searchData && !!hotelIds && !!checkIn && !!checkOut && rooms.length > 0 && !isLoadingDetails,
        staleTime: 2 * 60 * 1000,
        retry: 1,
        // Add error handling for large datasets
        onError: (error) => {
            console.error('Search query error:', error);
            setDataLoadError(error.message);
        }
    });

    // Use fetched data if state is not available
    useEffect(() => {
        if (!searchData && fetchedData) {
            setSearchData(fetchedData);
        }
    }, [fetchedData, searchData]);

    // Redirect if no data at all
    useEffect(() => {
        const isLoadingAny = isLoadingDetails || isLoadingSearch;
        if (!isLoadingAny && !searchData && !fetchedData && !dataLoadError) {
            console.warn('No search data available, redirecting to home');
            navigate('/', { replace: true });
        }
    }, [isLoadingDetails, isLoadingSearch, searchData, fetchedData, dataLoadError, navigate]);

    // ==================== STEP 3: Infinite Scroll Pagination ====================
    // Extract all hotels from search results
    const allHotels = useMemo(() => {
        if (!searchData?.searchResults) return [];
        return searchData.searchResults.map(result => result.Hotel);
    }, [searchData]);

    // Infinite query for paginating through hotels
    const {
        data: paginatedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isPaginationLoading
    } = useInfiniteQuery({
        queryKey: ['hotelsPaginated', allHotels],
        queryFn: async ({ pageParam = 0 }) => {
            // Simulate async pagination (client-side slicing)
            await new Promise(resolve => setTimeout(resolve, 100)); // Smooth loading effect

            const start = pageParam * HOTELS_PER_PAGE;
            const end = start + HOTELS_PER_PAGE;
            const pageData = allHotels.slice(start, end);

            if (process.env.NODE_ENV === 'development') {
                console.log(`📄 Loaded page ${pageParam}: ${pageData.length} hotels (${start}-${end})`);
            }

            return {
                hotels: pageData,
                nextPage: end < allHotels.length ? pageParam + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: allHotels.length > 0,
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
    });

    // Get displayed hotels (flatten all pages)
    const displayedHotels = useMemo(() => {
        return paginatedData?.pages?.flatMap(page => page.hotels) || [];
    }, [paginatedData]);

    // ==================== Intersection Observer for Infinite Scroll ====================
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    console.log('🔄 Intersection detected, loading more hotels...');
                    fetchNextPage();
                }
            },
            {
                threshold: 0.1,
                rootMargin: "200px" // Start loading before user reaches the bottom
            }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ==================== Helper Functions ====================
    // Get tarif for a specific hotel
    const getTarifForHotel = useCallback((hotelId) => {
        const result = searchData?.searchResults?.find(r => r.Hotel?.Id === hotelId);
        return result?._fullPriceDetails || result?.Tarif || result?.Price || null;
    }, [searchData]);

    // Format date helper
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
        });
    };

    // ==================== Loading State ====================
    const isLoading = isLoadingDetails || isLoadingSearch;

    const progressSteps = useMemo(() => {
        const steps = [];
        if (isLoadingDetails) {
            const hotelCount = hotelIds?.length || 0;
            steps.push(`📋 Récupération des détails (${hotelCount > 100 ? '100+' : hotelCount} hôtels)`);
        }
        if (isLoadingSearch) {
            steps.push("🔍 Recherche des disponibilités et prix");
        }
        return steps;
    }, [isLoadingDetails, isLoadingSearch, hotelIds]);

    if (isLoading) {
        return (
            <Loader
                message="Chargement des résultats..."
                submessage={hotelIds && hotelIds.length > 50 ? "Traitement d'un grand nombre d'hôtels, veuillez patienter" : "Cette opération peut prendre quelques instants"}
                showProgress={progressSteps.length > 0}
                progressSteps={progressSteps}
                size="large"
                variant="gradient"
                fullHeight={true}
            />
        );
    }

    // ==================== Error Handling ====================
    const hasError = isErrorDetails || isError || dataLoadError;
    const errorMessage = dataLoadError || errorDetails?.message || error?.message;

    if (hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur de chargement</h2>
                    <p className="text-gray-600 mb-2">
                        {errorMessage || "Impossible de charger les résultats de recherche"}
                    </p>
                    {hotelIds && hotelIds.length > 100 && (
                        <p className="text-sm text-orange-600 mb-6 p-3 bg-orange-50 rounded-lg">
                            ⚠️ Recherche de {hotelIds.length} hôtels détectée. Veuillez affiner votre recherche pour de meilleures performances.
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => {
                                // Clear sessionStorage and retry
                                sessionStorage.removeItem('current_search_id');
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold transition-all"
                        >
                            Nouvelle recherche
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Wait for data
    if (!searchData) {
        return (
            <Loader
                message="Préparation des données..."
                size="medium"
                variant="gradient"
                fullHeight={true}
            />
        );
    }

    const {
        searchId = null,
        countResults = 0,
        searchCriteria = null
    } = searchData;

    // Search Summary Banner Component
    const SearchSummaryBanner = (
        <div className="bg-white shadow-md mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            // Clear sessionStorage when going back
                            const currentSearchId = sessionStorage.getItem('current_search_id');
                            if (currentSearchId) {
                                sessionStorage.removeItem(currentSearchId);
                                sessionStorage.removeItem('current_search_id');
                            }
                            navigate('/');
                        }}
                        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Nouvelle recherche</span>
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                                Résultats de recherche
                            </h1>
                            <p className="text-gray-600 text-base sm:text-lg">
                                {countResults} hôtel{countResults > 1 ? 's' : ''} trouvé{countResults > 1 ? 's' : ''}
                                {displayedHotels.length < allHotels.length && (
                                    <span className="text-sm text-gray-500 ml-2">
                                        ({displayedHotels.length} affichés)
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Dates Badge */}
                            {searchCriteria?.checkIn && searchCriteria?.checkOut && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-lg border border-sky-100">
                                    <Calendar size={18} className="text-sky-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {formatDate(searchCriteria.checkIn)} - {formatDate(searchCriteria.checkOut)}
                                    </span>
                                </div>
                            )}

                            {/* Rooms Badge */}
                            {searchCriteria?.rooms && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
                                    <Users size={18} className="text-orange-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {searchCriteria.rooms.length} chambre{searchCriteria.rooms.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}

                            {/* Nights Badge */}
                            {searchCriteria?.nights && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                                    <Moon size={18} className="text-purple-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {searchCriteria.nights} nuit{searchCriteria.nights > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning for large datasets */}
                    {allHotels.length > 50 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                Grand nombre de résultats ({allHotels.length} hôtels). Les résultats sont chargés progressivement pour de meilleures performances.
                            </p>
                        </div>
                    )}

                    {/* Search ID (optional - for debugging) */}
                    {searchId && process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-gray-400 mt-4">
                            ID de recherche: {searchId}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    // ==================== Render Main Content ====================
    return (
        <>
            <HotelsListView
                hotels={displayedHotels}
                initialFilters={{}}
                showPricing={true}
                searchCriteria={searchCriteria}
                getTarifForHotel={getTarifForHotel}
                headerContent={SearchSummaryBanner}
                isLoading={isPaginationLoading && displayedHotels.length === 0}
                isError={false}
                error={null}
            />

            {/* Infinite Scroll Trigger & Loading Indicator */}
            {displayedHotels.length > 0 && (
                <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 pb-8">
                    {hasNextPage && (
                        <div ref={loadMoreRef} className="mt-6">
                            {isFetchingNextPage ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <Loader
                                        message="Chargement de plus d'hôtels..."
                                        size="small"
                                        variant="spinner"
                                        fullHeight={false}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => fetchNextPage()}
                                    className="w-full px-6 py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <ChevronDown size={24} />
                                    Charger plus d'hôtels
                                </button>
                            )}
                        </div>
                    )}

                    {/* End of Results Indicator */}
                    {!hasNextPage && displayedHotels.length > 0 && (
                        <div className="text-center py-8 mt-6">
                            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-800 font-bold text-base lg:text-lg">
                                        Tous les résultats affichés !
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {allHotels.length} hôtel{allHotels.length > 1 ? 's' : ''} chargé{allHotels.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default HotelsSearchResultsPage;
