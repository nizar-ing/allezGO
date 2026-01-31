import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
    Search,
    Calendar,
    Users,
    Hotel,
    AlertCircle,
    ArrowLeft,
    Grid3x3,
    List,
    ArrowUpDown,
    CheckCircle,
    ChevronDown,
    MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";
import HotelLightCard from "../components/HotelLightCard.jsx";
import Loader from "../ui/Loader.jsx";

function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Parse URL parameters
    const selectionType = searchParams.get('selectionType');
    const cityId = searchParams.get('cityId');
    const cityName = searchParams.get('cityName');
    const countryName = searchParams.get('countryName');
    const hotelId = searchParams.get('hotelId');
    const hotelName = searchParams.get('hotelName');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const roomsParam = searchParams.get('rooms');
    const nightsParam = searchParams.get('nights');

    // Parse rooms data
    const rooms = useMemo(() => {
        try {
            return JSON.parse(roomsParam || '[]');
        } catch (e) {
            return [];
        }
    }, [roomsParam]);

    // ✅ Calculate nights from dates
    const nights = useMemo(() => {
        if (nightsParam) return Number(nightsParam);
        if (!checkIn || !checkOut) return 1;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [checkIn, checkOut, nightsParam]);

    // State management
    const [filters, setFilters] = useState({});
    const [sortBy, setSortBy] = useState("recommended");
    const [viewMode, setViewMode] = useState("list");

    // Intersection Observer ref for infinite scroll
    const loadMoreRef = useRef(null);

    // Items per page
    const HOTELS_PER_PAGE = 10;

    // Validate search params
    useEffect(() => {
        if (!selectionType || !checkIn || !checkOut || rooms.length === 0) {
            toast.error("Paramètres de recherche invalides");
            navigate('/');
        }
    }, [selectionType, checkIn, checkOut, rooms, navigate]);

    // Step 1: Fetch hotel details (for building a map of full hotel data)
    const {
        data: hotelsData,
        isLoading: isLoadingHotels,
        isError: isErrorHotels,
        error: errorHotels,
    } = useQuery({
        queryKey: ['hotelDetails', cityId, hotelId, selectionType],
        queryFn: async () => {
            if (selectionType === 'hotel') {
                // For single hotel: fetch full details using getHotel
                try {
                    const hotelDetail = await apiClient.getHotel(Number(hotelId));
                    return {
                        hotels: [hotelDetail],
                        hotelIds: [Number(hotelId)]
                    };
                } catch (error) {
                    // If getHotel fails, try to find it in the city's hotel list
                    console.warn("Failed to fetch hotel details directly, trying listHotel...");
                    if (cityId) {
                        const hotels = await apiClient.listHotel(Number(cityId));
                        const targetHotel = hotels.find(h => h.Id === Number(hotelId));
                        if (targetHotel) {
                            return {
                                hotels: [targetHotel],
                                hotelIds: [Number(hotelId)]
                            };
                        }
                    }
                    // Last resort: just return the ID and we'll use data from search results
                    return {
                        hotels: [],
                        hotelIds: [Number(hotelId)]
                    };
                }
            } else if (selectionType === 'city') {
                // For city: fetch all hotels in the city
                const hotels = await apiClient.listHotel(Number(cityId));
                return {
                    hotels: hotels,
                    hotelIds: hotels.map(hotel => hotel.Id)
                };
            }
            return { hotels: [], hotelIds: [] };
        },
        enabled: !!(selectionType && (cityId || hotelId)),
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // Create a map of hotel details for easy lookup
    const hotelsDetailsMap = useMemo(() => {
        if (!hotelsData?.hotels) return {};

        const detailsMap = {};
        hotelsData.hotels.forEach(hotel => {
            if (hotel && hotel.Id) {
                detailsMap[hotel.Id] = hotel;
            }
        });
        return detailsMap;
    }, [hotelsData]);

    const hotelIds = useMemo(() => {
        return hotelsData?.hotelIds || [];
    }, [hotelsData]);

    // Step 2: Search hotels (includes pricing and availability)
    const {
        data: searchResults,
        isLoading: isLoadingSearch,
        isError: isErrorSearch,
        error: errorSearch,
    } = useQuery({
        queryKey: ['hotelSearch', hotelIds, checkIn, checkOut, rooms],
        queryFn: async () => {
            if (!hotelIds || hotelIds.length === 0) {
                throw new Error("Aucun hôtel à rechercher");
            }

            const searchData = {
                checkIn,
                checkOut,
                hotels: hotelIds,
                rooms: rooms.map(room => ({
                    adult: room.adults,
                    child: room.children.length > 0 ? room.children : undefined
                })),
                filters: {
                    keywords: "",
                    category: [],
                    onlyAvailable: true,
                    tags: []
                }
            };

            const result = await apiClient.searchHotel(searchData);

            if (result.errorMessage && result.errorMessage.Code) {
                throw new Error(result.errorMessage.Description || 'Erreur de recherche');
            }

            return result;
        },
        enabled: !!(hotelIds && hotelIds.length > 0 && checkIn && checkOut),
        staleTime: 2 * 60 * 1000,
        retry: 1,
    });

    // Step 3: Merge search results with full hotel details
    const processedHotels = useMemo(() => {
        if (!searchResults?.hotelSearch) {
            return [];
        }

        return searchResults.hotelSearch.map(searchResult => {
            // Get hotel details from search result
            const hotelFromSearch = searchResult.Hotel;

            // Get full hotel details from our details map (if available)
            const fullDetails = hotelsDetailsMap[hotelFromSearch.Id];

            // Calculate min/max prices from boarding options
            let minPrice = null;
            let maxPrice = null;

            if (searchResult.Price?.Boarding) {
                const allPrices = [];

                searchResult.Price.Boarding.forEach(boarding => {
                    boarding.Pax?.forEach(pax => {
                        pax.Rooms?.forEach(room => {
                            if (room.Price) {
                                const price = parseFloat(room.Price);
                                if (!isNaN(price)) {
                                    allPrices.push(price);
                                }
                            }
                        });
                    });
                });

                if (allPrices.length > 0) {
                    minPrice = Math.min(...allPrices);
                    maxPrice = Math.max(...allPrices);
                }
            }

            // ✅ Create pricing object in new format
            const pricing = minPrice ? {
                minPrice,
                maxPrice,
                currency: searchResult.Currency,
                available: true,
                token: searchResult.Token
            } : null;

            // Merge data: Priority to fullDetails, fallback to hotelFromSearch
            return {
                // Core Information - prefer fullDetails
                Id: hotelFromSearch.Id,
                Name: fullDetails?.Name || hotelFromSearch.Name,

                // Category
                Category: fullDetails?.Category || hotelFromSearch.Category,

                // Location
                City: fullDetails?.City || hotelFromSearch.City,
                Address: fullDetails?.Adress || fullDetails?.Address || hotelFromSearch.Adress,
                Adress: fullDetails?.Adress || hotelFromSearch.Adress,
                Localization: fullDetails?.Localization || hotelFromSearch.Localization,

                // Descriptions
                ShortDescription: fullDetails?.ShortDescription || hotelFromSearch.ShortDescription,
                Description: fullDetails?.Description || fullDetails?.ShortDescription || hotelFromSearch.ShortDescription,

                // Images - prioritize Album
                Image: fullDetails?.Image || hotelFromSearch.Image,
                Images: fullDetails?.Album || (hotelFromSearch.Image ? [hotelFromSearch.Image] : []),
                Album: fullDetails?.Album || [],

                // Facilities & Features - CRITICAL for single hotel search
                Facilities: fullDetails?.Facilities || [],
                Theme: fullDetails?.Theme || hotelFromSearch.Theme || [],
                Tag: fullDetails?.Tag || [],
                Equipments: fullDetails?.Equipments || fullDetails?.Facilities || [],

                // Additional details from fullDetails
                Email: fullDetails?.Email,
                Phone: fullDetails?.Phone,
                Vues: fullDetails?.Vues || [],
                Type: fullDetails?.Type,
                Boarding: fullDetails?.Boarding || [],

                // ✅ NEW: Pricing in correct format for new HotelLightCard
                pricing,

                // Keep old format for backward compatibility
                MinPrice: minPrice,
                MaxPrice: maxPrice,
                Currency: searchResult.Currency,
                PriceDetails: searchResult.Price,

                // Search metadata
                Token: searchResult.Token,
                Recommended: searchResult.Recommended,
                FreeChild: searchResult.FreeChild,
                Source: searchResult.Source,

                // Availability flag
                IsAvailable: true,

                // Metadata
                _searchResult: true,
                _hasFullDetails: !!fullDetails,
                _dataSource: fullDetails ? 'merged' : 'search-only',
            };
        });
    }, [searchResults, hotelsDetailsMap]);

    // Filter hotels
    const getFilteredHotels = useCallback(() => {
        let filtered = [...processedHotels];

        if (filters.categories && filters.categories.length > 0) {
            filtered = filtered.filter((hotel) =>
                filters.categories.includes(hotel.Category?.Star)
            );
        }

        if (filters.services && filters.services.length > 0) {
            filtered = filtered.filter((hotel) =>
                hotel.Theme?.some((theme) =>
                    filters.services.some((service) =>
                        theme.toLowerCase().includes(service.toLowerCase())
                    )
                )
            );
        }

        if (filters.priceRange) {
            filtered = filtered.filter((hotel) => {
                const price = hotel.MinPrice || 0;
                return price >= filters.priceRange.min && price <= filters.priceRange.max;
            });
        }

        return filtered;
    }, [processedHotels, filters]);

    // Sort hotels
    const getSortedHotels = useCallback((hotels) => {
        const sorted = [...hotels];

        switch (sortBy) {
            case "price-asc":
                return sorted.sort((a, b) => (a.MinPrice || 0) - (b.MinPrice || 0));
            case "price-desc":
                return sorted.sort((a, b) => (b.MinPrice || 0) - (a.MinPrice || 0));
            case "rating":
                return sorted.sort((a, b) => (b.Category?.Star || 0) - (a.Category?.Star || 0));
            case "name-asc":
                return sorted.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
            case "recommended":
            default:
                return sorted.sort((a, b) => {
                    const scoreA = a.Recommended || 0;
                    const scoreB = b.Recommended || 0;
                    if (scoreB !== scoreA) return scoreB - scoreA;
                    return (b.Category?.Star || 0) - (a.Category?.Star || 0);
                });
        }
    }, [sortBy]);

    const filteredHotels = getFilteredHotels();
    const sortedHotels = getSortedHotels(filteredHotels);

    // Infinite scroll pagination
    const {
        data: paginatedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['hotels-paginated', sortedHotels, filters, sortBy],
        queryFn: async ({ pageParam = 0 }) => {
            const start = pageParam * HOTELS_PER_PAGE;
            const end = start + HOTELS_PER_PAGE;
            const pageData = sortedHotels.slice(start, end);

            return {
                hotels: pageData,
                nextPage: end < sortedHotels.length ? pageParam + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: sortedHotels.length > 0,
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
    });

    const displayedHotels = paginatedData?.pages?.flatMap((page) => page.hotels) || [];

    // Intersection Observer
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ✅ Handle favorites
    const handleFavoriteToggle = (hotelId, isFavorite) => {
        const favorites = JSON.parse(localStorage.getItem("favoriteHotels") || "[]");
        if (isFavorite) {
            favorites.push(hotelId);
        } else {
            const index = favorites.indexOf(hotelId);
            if (index > -1) favorites.splice(index, 1);
        }
        localStorage.setItem("favoriteHotels", JSON.stringify(favorites));
    };

    // ✅ Navigate to hotel detail page
    const handleViewHotelDetail = (hotelId) => {
        navigate(`/hotels/${hotelId}`, {
            state: {
                searchParams: { checkIn, checkOut, rooms },
                returnUrl: window.location.pathname + window.location.search
            }
        });
    };

    // ✅ Handle booking
    const handleBookHotel = (hotel) => {
        navigate(`/hotels/${hotel.Id}`, {
            state: {
                searchParams: { checkIn, checkOut, rooms },
                bookingIntent: true,
                nights
            }
        });

        toast.success(`Réservation pour ${hotel.Name}`, {
            duration: 2000
        });
    };

    // Calculate total guests
    const totalGuests = useMemo(() => {
        const adults = rooms.reduce((sum, room) => sum + room.adults, 0);
        const children = rooms.reduce((sum, room) => sum + room.children.length, 0);
        return { adults, children };
    }, [rooms]);

    const sortOptions = [
        { value: "recommended", label: "Recommandés" },
        { value: "price-asc", label: "Prix croissant" },
        { value: "price-desc", label: "Prix décroissant" },
        { value: "rating", label: "Meilleures notes" },
        { value: "name-asc", label: "Nom (A-Z)" },
    ];

    const isLoading = isLoadingHotels || isLoadingSearch;
    const isError = isErrorHotels || isErrorSearch;
    const error = errorHotels || errorSearch;

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <Loader message="Recherche des hôtels disponibles..." fullHeight={true} />
            </div>
        );
    }

    const formatDisplayDate = (dateString) => {
        const date = new Date(dateString);
        const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
            {/* Search Summary Banner */}
            <div className="bg-white shadow-md border-b border-gray-200 mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors">
                        <ArrowLeft size={20} />
                        <span>Modifier la recherche</span>
                    </Link>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-sky-100 rounded-lg flex-shrink-0">
                                <MapPin className="text-sky-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Destination</p>
                                <p className="font-bold text-gray-800 truncate">
                                    {selectionType === 'city' ? cityName : hotelName}
                                </p>
                                {selectionType === 'hotel' && cityName && (
                                    <p className="text-xs text-gray-500">{cityName}</p>
                                )}
                                {countryName && <p className="text-xs text-gray-500">{countryName}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                <Calendar className="text-green-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Dates</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {formatDisplayDate(checkIn)} - {formatDisplayDate(checkOut)}
                                </p>
                                <p className="text-xs text-gray-500">{nights} nuit{nights > 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                <Users className="text-purple-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Voyageurs</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {totalGuests.adults} adulte{totalGuests.adults > 1 ? 's' : ''}
                                    {totalGuests.children > 0 && `, ${totalGuests.children} enfant${totalGuests.children > 1 ? 's' : ''}`}
                                </p>
                                <p className="text-xs text-gray-500">{rooms.length} chambre{rooms.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                                <Search className="text-amber-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Type de recherche</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {selectionType === 'city' ? 'Tous les hôtels' : 'Hôtel spécifique'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {hotelIds?.length || 0} hôtel{(hotelIds?.length || 0) > 1 ? 's' : ''} recherché{(hotelIds?.length || 0) > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="p-1.5 sm:p-2 bg-sky-100 rounded-lg flex-shrink-0">
                                <Hotel className="text-sky-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-500">Hôtels disponibles</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                                    {sortedHotels.length} résultat{sortedHotels.length > 1 ? 's' : ''}
                                    {displayedHotels.length < sortedHotels.length && (
                                        <span className="text-xs sm:text-sm text-gray-500 font-normal ml-1 sm:ml-2">
                                            ({displayedHotels.length} affichés)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px]">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all cursor-pointer"
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <ArrowUpDown size={16} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 bg-gray-100 rounded-lg sm:rounded-xl">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${viewMode === "list" ? "bg-sky-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${viewMode === "grid" ? "bg-sky-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                                >
                                    <Grid3x3 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isError && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                        <AlertCircle size={48} className="sm:w-16 sm:h-16 mx-auto text-red-500 mb-3 sm:mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Erreur de recherche</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                            {error?.message || "Impossible de rechercher les hôtels disponibles."}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Retour à la recherche
                        </button>
                    </div>
                )}

                {!isLoading && !isError && sortedHotels.length === 0 && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                        <Search size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Aucun hôtel disponible</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                            Aucun hôtel ne correspond à vos critères de recherche pour ces dates.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Nouvelle recherche
                        </button>
                    </div>
                )}

                {!isLoading && !isError && displayedHotels.length > 0 && (
                    <>
                        {viewMode === "list" ? (
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                {displayedHotels.map((hotel, index) => (
                                    <HotelLightCard
                                        key={`${hotel.Id}-${index}`}
                                        hotel={hotel}
                                        onFavoriteToggle={handleFavoriteToggle}
                                        pricing={hotel.pricing}
                                        onBook={() => handleBookHotel(hotel)}
                                        onViewDetail={() => handleViewHotelDetail(hotel.Id)}
                                        showBookButton={true}
                                        nights={nights}
                                        searchParams={{ checkIn, checkOut, rooms }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                {displayedHotels.map((hotel, index) => (
                                    <HotelLightCard
                                        key={`${hotel.Id}-${index}`}
                                        hotel={hotel}
                                        onFavoriteToggle={handleFavoriteToggle}
                                        pricing={hotel.pricing}
                                        onBook={() => handleBookHotel(hotel)}
                                        onViewDetail={() => handleViewHotelDetail(hotel.Id)}
                                        showBookButton={true}
                                        nights={nights}
                                        searchParams={{ checkIn, checkOut, rooms }}
                                    />
                                ))}
                            </div>
                        )}

                        {hasNextPage && (
                            <div ref={loadMoreRef} className="mt-6 sm:mt-8">
                                {isFetchingNextPage ? (
                                    <Loader message="Chargement de plus d'hôtels" fullHeight={false} className="bg-white rounded-xl sm:rounded-2xl shadow-lg" />
                                ) : (
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => fetchNextPage()}
                                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <ChevronDown size={20} className="sm:w-6 sm:h-6" />
                                            Charger plus d'hôtels
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasNextPage && displayedHotels.length > 0 && (
                            <div className="text-center py-6 sm:py-8 mt-4 sm:mt-6">
                                <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl shadow-md max-w-full mx-2">
                                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                                    <div className="text-left">
                                        <p className="text-gray-800 font-bold text-sm sm:text-base lg:text-lg">
                                            Tous les résultats affichés !
                                        </p>
                                        <p className="text-gray-600 text-xs sm:text-sm">
                                            {sortedHotels.length} hôtel{sortedHotels.length > 1 ? 's' : ''} disponible{sortedHotels.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default SearchResultsPage;
