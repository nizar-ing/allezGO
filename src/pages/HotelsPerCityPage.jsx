import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
    MapPin,
    X,
    Grid3x3,
    List,
    ChevronDown,
    Map as MapIcon,
    Search,
    Hotel,
    AlertCircle,
    Filter,
    ArrowUpDown,
    CheckCircle,
    Calendar,
    Users,
    RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";
import HotelsFiltering from "../components/HotelsFiltering.jsx";
import HotelLightCard from "../components/HotelLightCard.jsx";
import Loader from "../ui/Loader.jsx";

function HotelsPerCityPage() {
    const { cityId } = useParams();
    const navigate = useNavigate();

    // ✅ AUTO-SET DEFAULT DATES: Tomorrow check-in, +1 night check-out
    const getDefaultDates = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        return {
            checkIn: tomorrow.toISOString().split('T')[0],
            checkOut: dayAfter.toISOString().split('T')[0]
        };
    };

    // State management
    const [filters, setFilters] = useState({});
    const [sortBy, setSortBy] = useState("recommended");
    const [viewMode, setViewMode] = useState("list");
    const [showFilters, setShowFilters] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [cityInfo, setCityInfo] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ✅ DEFAULT: 1 night, 1 adult, starting tomorrow
    const defaultDates = getDefaultDates();
    const [searchParams, setSearchParams] = useState({
        checkIn: defaultDates.checkIn,
        checkOut: defaultDates.checkOut,
        rooms: [{ adults: 1, children: [] }] // Changed to 1 adult by default
    });

    // Auto-enable pricing on mount
    const [enablePricing, setEnablePricing] = useState(true);

    const loadMoreRef = useRef(null);
    const HOTELS_PER_PAGE = 10;

    // ✅ STEP 1: Fetch all hotels with details
    const {
        data: allHotelsData,
        isLoading: isLoadingAll,
        isError: isErrorAll,
        error: errorAll,
    } = useQuery({
        queryKey: ["hotels-enhanced", cityId],
        queryFn: async () => {
            const hotels = await apiClient.listHotelEnhanced(Number(cityId), {
                batchSize: 5,
                delayBetweenBatches: 150,
                onProgress: (current, total) => {
                    console.log(`⏳ Loading hotels: ${current}/${total}`);
                }
            });
            return hotels;
        },
        enabled: !!cityId,
        staleTime: 10 * 60 * 1000,
        retry: 2,
    });

    // ✅ STEP 2: Auto-fetch pricing with default dates
    const {
        data: pricingData,
        isLoading: isLoadingPricing,
        isError: isErrorPricing,
        refetch: refetchPricing,
    } = useQuery({
        queryKey: ["hotel-pricing", cityId, searchParams.checkIn, searchParams.checkOut, searchParams.rooms],
        queryFn: async () => {
            if (!allHotelsData || !searchParams.checkIn || !searchParams.checkOut) {
                return null;
            }

            console.log('🔍 Fetching pricing for:', {
                checkIn: searchParams.checkIn,
                checkOut: searchParams.checkOut,
                hotels: allHotelsData.length,
                rooms: searchParams.rooms
            });

            const hotelIds = allHotelsData.map(h => h.Id);

            const result = await apiClient.searchHotel({
                checkIn: searchParams.checkIn,
                checkOut: searchParams.checkOut,
                hotels: hotelIds,
                rooms: searchParams.rooms.map(room => ({
                    adult: room.adults,
                    child: room.children.length > 0 ? room.children : undefined
                })),
                filters: {
                    keywords: "",
                    category: [],
                    onlyAvailable: true,
                    tags: []
                }
            });

            // Create pricing map
            const pricingMap = {};
            result.hotelSearch.forEach(item => {
                let minPrice = null;
                if (item.Price?.Boarding) {
                    const allPrices = [];
                    item.Price.Boarding.forEach(boarding => {
                        boarding.Pax?.forEach(pax => {
                            pax.Rooms?.forEach(room => {
                                if (room.Price) {
                                    allPrices.push(parseFloat(room.Price));
                                }
                            });
                        });
                    });
                    if (allPrices.length > 0) {
                        minPrice = Math.min(...allPrices);
                    }
                }

                pricingMap[item.Hotel.Id] = {
                    minPrice,
                    currency: item.Currency,
                    available: true,
                    token: item.Token
                };
            });

            console.log('✅ Pricing loaded for', Object.keys(pricingMap).length, 'hotels');
            return pricingMap;
        },
        enabled: enablePricing && !!allHotelsData && !!searchParams.checkIn && !!searchParams.checkOut,
        staleTime: 2 * 60 * 1000,
    });

    // Fetch city information
    const { data: citiesData } = useQuery({
        queryKey: ["cities"],
        queryFn: async () => {
            const cities = await apiClient.listCity();
            return cities;
        },
        staleTime: 10 * 60 * 1000,
    });

    // Get current city info
    useEffect(() => {
        if (citiesData && cityId) {
            const city = citiesData.find((c) => c.Id === Number(cityId));
            setCityInfo(city);
        }
    }, [citiesData, cityId]);

    // ✅ Show toast when pricing loads
    useEffect(() => {
        if (pricingData && !isLoadingPricing) {
            const count = Object.keys(pricingData).length;
            toast.success(`Prix chargés pour ${count} hôtels disponibles!`, {
                duration: 3000,
                icon: '💰'
            });
        }
    }, [pricingData, isLoadingPricing]);

    // ✅ Show error toast if pricing fails
    useEffect(() => {
        if (isErrorPricing) {
            toast.error('Impossible de charger les prix. Réessayez.', {
                duration: 4000
            });
        }
    }, [isErrorPricing]);

    // Merge hotels with pricing data
    const hotelsWithPricing = useMemo(() => {
        if (!allHotelsData) return [];

        return allHotelsData.map(hotel => ({
            ...hotel,
            pricing: pricingData?.[hotel.Id] || null
        }));
    }, [allHotelsData, pricingData]);

    // Filter hotels
    const getFilteredHotels = useCallback(() => {
        if (!hotelsWithPricing) return [];

        let filtered = [...hotelsWithPricing];

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

        if (filters.disponibleSeulement && pricingData) {
            filtered = filtered.filter((hotel) => hotel.pricing?.available);
        }

        if (filters.priceRange && pricingData) {
            filtered = filtered.filter((hotel) => {
                const price = hotel.pricing?.minPrice;
                if (!price) return false;
                return price >= filters.priceRange.min && price <= filters.priceRange.max;
            });
        }

        return filtered;
    }, [hotelsWithPricing, filters, pricingData]);

    // Sort hotels
    const getSortedHotels = useCallback((hotels) => {
        const sorted = [...hotels];

        switch (sortBy) {
            case "price-asc":
                return sorted.sort((a, b) => {
                    const priceA = a.pricing?.minPrice || Infinity;
                    const priceB = b.pricing?.minPrice || Infinity;
                    return priceA - priceB;
                });
            case "price-desc":
                return sorted.sort((a, b) => {
                    const priceA = a.pricing?.minPrice || 0;
                    const priceB = b.pricing?.minPrice || 0;
                    return priceB - priceA;
                });
            case "rating":
                return sorted.sort((a, b) => {
                    return (b.Category?.Star || 0) - (a.Category?.Star || 0);
                });
            case "name-asc":
                return sorted.sort((a, b) => a.Name.localeCompare(b.Name));
            case "recommended":
            default:
                return sorted.sort((a, b) => {
                    if (a.pricing && !b.pricing) return -1;
                    if (!a.pricing && b.pricing) return 1;
                    const starDiff = (b.Category?.Star || 0) - (a.Category?.Star || 0);
                    if (starDiff !== 0) return starDiff;
                    return a.Name.localeCompare(b.Name);
                });
        }
    }, [sortBy]);

    const filteredHotels = getFilteredHotels();
    const sortedHotels = getSortedHotels(filteredHotels);

    // Infinite Query for paginated display
    const {
        data: paginatedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isPaginationLoading,
    } = useInfiniteQuery({
        queryKey: ["hotels-paginated", cityId, filters, sortBy, pricingData],
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
        enabled: !!hotelsWithPricing && sortedHotels.length > 0,
        staleTime: 5 * 60 * 1000,
        initialPageParam: 0,
    });

    const displayedHotels = paginatedData?.pages?.flatMap((page) => page.hotels) || [];

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage();
                }
            },
            {
                threshold: 0.1,
                rootMargin: "100px",
            }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Handle favorite toggle
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

    // ✅ Handle date validation
    const handleDateChange = (type, value) => {
        if (type === 'checkIn') {
            setSearchParams(prev => {
                if (prev.checkOut && new Date(prev.checkOut) <= new Date(value)) {
                    return { ...prev, checkIn: value, checkOut: null };
                }
                return { ...prev, checkIn: value };
            });
        } else {
            setSearchParams(prev => ({ ...prev, checkOut: value }));
        }
    };

    // ✅ Handle search/refresh pricing
    const handleSearchPricing = () => {
        if (!searchParams.checkIn || !searchParams.checkOut) {
            toast.error("Veuillez sélectionner les dates de séjour");
            return;
        }

        setEnablePricing(false);
        setTimeout(() => {
            setEnablePricing(true);
            toast.loading("Recherche des prix...", { duration: 1000 });
        }, 100);
    };

    // ✅ Navigate to hotel detail page (NOT city page!)
    const handleBookHotel = (hotel) => {
        const nights = Math.ceil(
            (new Date(searchParams.checkOut) - new Date(searchParams.checkIn)) / (1000 * 60 * 60 * 24)
        );

        navigate(
            `/hotels/search?hotelIds=${hotel.Id}&checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}&rooms=${encodeURIComponent(JSON.stringify(searchParams.rooms))}`,
            {
                state: {
                    searchCriteria: {
                        checkIn: searchParams.checkIn,
                        checkOut: searchParams.checkOut,
                        rooms: searchParams.rooms,
                        nights
                    }
                }
            }
        );
    };

    // ✅ Navigate to hotel detail page
    const handleViewHotelDetail = (hotelId) => {
        navigate(`/hotels/${hotelId}`);
    };

    // ✅ Room management
    const handleAddRoom = () => {
        setSearchParams(prev => ({
            ...prev,
            rooms: [...prev.rooms, { adults: 1, children: [] }]
        }));
    };

    const handleRemoveRoom = (index) => {
        if (searchParams.rooms.length === 1) {
            toast.error("Au moins une chambre requise");
            return;
        }
        setSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateRoom = (index, field, value) => {
        setSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === index ? { ...room, [field]: parseInt(value) } : room
            )
        }));
    };

    // Calculate nights
    const nights = searchParams.checkIn && searchParams.checkOut
        ? Math.ceil((new Date(searchParams.checkOut) - new Date(searchParams.checkIn)) / (1000 * 60 * 60 * 24))
        : 1;

    // Sort options
    const sortOptions = [
        { value: "recommended", label: "Recommandés" },
        { value: "price-asc", label: "Prix croissant", disabled: !pricingData },
        { value: "price-desc", label: "Prix décroissant", disabled: !pricingData },
        { value: "rating", label: "Meilleures notes" },
        { value: "name-asc", label: "Nom (A-Z)" },
    ];

    // ✅ Use hotel's first image as banner (if available)
    const getBannerImage = () => {
        if (displayedHotels.length > 0 && displayedHotels[0].Album?.[0]) {
            return displayedHotels[0].Album[0];
        }

        // Fallback city banners
        const cityBanners = {
            10: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200",
            18: "https://images.unsplash.com/photo-1580837119756-563d608dd119?w=1200",
            33: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200",
        };

        return cityBanners[cityId] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";
    };

    const isLoading = isLoadingAll || isPaginationLoading;
    const isError = isErrorAll;
    const error = errorAll;

    // Show full page loader on initial load
    if (isLoadingAll && !allHotelsData) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 overflow-hidden bg-gray-200 animate-pulse mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent"></div>
                </div>

                <Loader
                    message={`Chargement des hôtels à ${cityInfo?.Name || "..."}`}
                    submessage="Récupération des détails complets..."
                    fullHeight={true}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
            {/* ✅ Hero Banner - Using hotel's first image */}
            <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 overflow-hidden mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl">
                <img
                    src={getBannerImage()}
                    alt={cityInfo?.Name || "City"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <MapPin className="text-white flex-shrink-0" size={20} />
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl leading-tight">
                                Hôtels à {cityInfo?.Name || "..."}
                            </h1>
                        </div>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-medium drop-shadow-lg ml-7 sm:ml-8">
                            {cityInfo?.Country?.Name || "Tunisie"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
                {/* ✅ Date Picker Banner - Auto-set with default dates */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <Calendar className="text-sky-600" size={24} />
                                Dates de séjour
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="font-semibold">{searchParams.checkIn}</span>
                                <span>→</span>
                                <span className="font-semibold">{searchParams.checkOut}</span>
                                <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold">
                                    {nights} nuit{nights > 1 ? 's' : ''}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                    {searchParams.rooms.reduce((sum, room) => sum + room.adults, 0)} adulte{searchParams.rooms.reduce((sum, room) => sum + room.adults, 0) > 1 ? 's' : ''}
                                </span>
                                {pricingData && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        ✓ Prix chargés
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
                        >
                            <Calendar size={20} />
                            Modifier les dates
                        </button>
                    </div>

                    {/* Date Picker Expanded */}
                    {showDatePicker && (
                        <div className="mt-4 p-4 bg-sky-50 rounded-xl border-2 border-sky-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date d'arrivée
                                    </label>
                                    <input
                                        type="date"
                                        value={searchParams.checkIn || ''}
                                        onChange={(e) => handleDateChange('checkIn', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date de départ
                                    </label>
                                    <input
                                        type="date"
                                        value={searchParams.checkOut || ''}
                                        onChange={(e) => handleDateChange('checkOut', e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                                        min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
                                        disabled={!searchParams.checkIn}
                                    />
                                </div>
                            </div>

                            {/* Room Selection */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Users size={18} className="text-gray-600" />
                                    Chambres et voyageurs
                                </h4>
                                {searchParams.rooms.map((room, index) => (
                                    <div key={index} className="flex items-center gap-3 mb-2 p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-600 font-medium">Chambre {index + 1}</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Users size={16} className="text-gray-400" />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="6"
                                                    value={room.adults}
                                                    onChange={(e) => handleUpdateRoom(index, 'adults', e.target.value)}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                                <span className="text-xs text-gray-600">adulte(s)</span>
                                            </div>
                                        </div>
                                        {searchParams.rooms.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveRoom(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {searchParams.rooms.length < 5 && (
                                    <button
                                        onClick={handleAddRoom}
                                        className="text-sm text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                                    >
                                        + Ajouter une chambre
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSearchPricing}
                                    disabled={!searchParams.checkIn || !searchParams.checkOut || isLoadingPricing}
                                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    {isLoadingPricing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Recherche...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={20} />
                                            Actualiser les prix
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pricing Error */}
                {isErrorPricing && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                            <div className="flex-1">
                                <p className="font-semibold text-red-800">
                                    Erreur lors de la recherche des prix
                                </p>
                                <p className="text-sm text-red-600">
                                    Impossible de récupérer les prix pour les dates sélectionnées.
                                </p>
                            </div>
                            <button
                                onClick={handleSearchPricing}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Bar */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 sticky top-16 sm:top-20 lg:top-4 z-40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="p-1.5 sm:p-2 bg-sky-100 rounded-lg flex-shrink-0">
                                <Hotel className="text-sky-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-500">Résultats trouvés</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                                    {sortedHotels.length} hôtel{sortedHotels.length > 1 ? "s" : ""}
                                    {displayedHotels.length < sortedHotels.length && (
                                        <span className="text-xs sm:text-sm text-gray-500 font-normal ml-1 sm:ml-2">
                                            ({displayedHotels.length} affichés)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-md active:scale-95 flex-1 sm:flex-initial justify-center"
                            >
                                <Filter size={18} />
                                <span className="hidden xs:inline">Filtres</span>
                            </button>

                            <div className="relative flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px]">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all cursor-pointer"
                                >
                                    {sortOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.disabled}
                                        >
                                            {option.label}{option.disabled ? ' (requis dates)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ArrowUpDown
                                    size={16}
                                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>

                            <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 bg-gray-100 rounded-lg sm:rounded-xl">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
                                        viewMode === "list"
                                            ? "bg-sky-600 text-white shadow-md"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${
                                        viewMode === "grid"
                                            ? "bg-sky-600 text-white shadow-md"
                                            : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    <Grid3x3 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {/* Filters Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3 xl:col-span-1">
                        <div className="sticky top-32 lg:top-28">
                            <HotelsFiltering
                                onFilterChange={handleFilterChange}
                                initialFilters={filters}
                                showPriceFilter={!!pricingData}
                            />
                        </div>
                    </aside>

                    {/* Hotels List */}
                    <main className="lg:col-span-9 xl:col-span-3">
                        {isError && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                                <AlertCircle size={48} className="sm:w-16 sm:h-16 mx-auto text-red-500 mb-3 sm:mb-4" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                                    Erreur de chargement
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                                    {error?.message || "Impossible de charger les hôtels. Veuillez réessayer."}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95"
                                >
                                    Réessayer
                                </button>
                            </div>
                        )}

                        {!isLoading && !isError && sortedHotels.length === 0 && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                                <Search size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                                    Aucun hôtel trouvé
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                                    Essayez de modifier vos filtres ou critères de recherche.
                                </p>
                                <button
                                    onClick={() => setFilters({})}
                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95"
                                >
                                    Réinitialiser les filtres
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
                                            />
                                        ))}
                                    </div>
                                )}

                                {hasNextPage && (
                                    <div ref={loadMoreRef} className="mt-6 sm:mt-8">
                                        {isFetchingNextPage ? (
                                            <Loader
                                                message="Chargement de plus d'hôtels"
                                                fullHeight={false}
                                                className="bg-white rounded-xl sm:rounded-2xl shadow-lg"
                                            />
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
                                                    Tous les hôtels affichés !
                                                </p>
                                                <p className="text-gray-600 text-xs sm:text-sm">
                                                    Vous avez vu les {sortedHotels.length} hôtel{sortedHotels.length > 1 ? "s" : ""} disponible{sortedHotels.length > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>

                {/* Map View Toggle */}
                {!isLoading && sortedHotels.length > 0 && (
                    <div className="mt-6 sm:mt-8 text-center px-2">
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 bg-white hover:bg-sky-50 border-2 border-sky-600 text-sky-700 font-bold text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto justify-center"
                        >
                            <MapIcon size={20} className="sm:w-6 sm:h-6" />
                            {showMap ? "Masquer la carte" : "Afficher la carte"}
                        </button>
                    </div>
                )}

                {/* Map Section */}
                {showMap && (
                    <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                                <MapIcon className="text-sky-600 flex-shrink-0" size={24} />
                                <span>Carte des hôtels</span>
                            </h3>
                            <button
                                onClick={() => setShowMap(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors self-end sm:self-auto"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-sky-100 to-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <div className="text-center px-4">
                                <MapIcon size={48} className="sm:w-16 sm:h-16 mx-auto text-sky-600 mb-3 sm:mb-4" />
                                <p className="text-gray-600 font-semibold text-sm sm:text-base">
                                    Intégration de la carte à venir
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                    Google Maps / Mapbox / Leaflet
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Filters Modal */}
            {showFilters && (
                <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-fade-in">
                    <div className="bg-white rounded-t-2xl sm:rounded-t-3xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
                        <div className="sticky top-0 bg-white border-b-2 border-gray-100 p-4 sm:p-5 flex items-center justify-between z-10 shadow-sm">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Filter size={22} className="text-sky-600" />
                                Filtres
                            </h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                            <HotelsFiltering
                                onFilterChange={(newFilters) => {
                                    handleFilterChange(newFilters);
                                    setShowFilters(false);
                                }}
                                initialFilters={filters}
                                showPriceFilter={!!pricingData}
                            />
                        </div>

                        <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 p-4 sm:p-5 flex gap-3 shadow-lg">
                            <button
                                onClick={() => {
                                    setFilters({});
                                    setShowFilters(false);
                                }}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all active:scale-95"
                            >
                                Réinitialiser
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95"
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Loading Overlay */}
            {isLoadingPricing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
                        <Loader
                            message="Recherche des prix..."
                            submessage={`Pour ${sortedHotels.length} hôtels sur ${nights} nuit${nights > 1 ? 's' : ''}`}
                            size="medium"
                            fullHeight={false}
                        />
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slide-up {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.2s ease-out;
                    }
                    .animate-slide-up {
                        animation: slide-up 0.3s ease-out;
                    }
                    .overflow-y-auto::-webkit-scrollbar {
                        width: 6px;
                    }
                    .overflow-y-auto::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 10px;
                    }
                    .overflow-y-auto::-webkit-scrollbar-thumb {
                        background: #0284c7;
                        border-radius: 10px;
                    }
                    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                        background: #0369a1;
                    }
                    @media (min-width: 375px) {
                        .xs\\:inline {
                            display: inline;
                        }
                    }
                `
            }} />
        </div>
    );
}

export default HotelsPerCityPage;
