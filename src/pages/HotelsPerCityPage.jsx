import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
    MapPin,
    X,
    Grid3x3,
    List,
    ChevronDown,
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
import { IoAddOutline, IoTrashOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
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

    // ✅ Manual month control for calendar
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // ✅ DEFAULT: 1 night, 2 adults, starting tomorrow
    const defaultDates = getDefaultDates();

    // ✅ ACTUAL search params (used for API calls)
    const [searchParams, setSearchParams] = useState({
        checkIn: defaultDates.checkIn,
        checkOut: defaultDates.checkOut,
        rooms: [{ adults: 2, children: [] }]
    });

    // ✅ NEW: TEMPORARY state for form inputs (not synced to API until "Actualiser les prix")
    const [tempSearchParams, setTempSearchParams] = useState({
        checkIn: defaultDates.checkIn,
        checkOut: defaultDates.checkOut,
        rooms: [{ adults: 2, children: [] }]
    });

    // ✅ Date range state for react-day-picker
    const [dateRange, setDateRange] = useState({
        from: new Date(defaultDates.checkIn),
        to: new Date(defaultDates.checkOut)
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

    // ✅ Handle date range selection from react-day-picker
    const handleDateRangeSelect = (range) => {
        if (range?.from) {
            setDateRange(range);
            setTempSearchParams(prev => ({
                ...prev,
                checkIn: range.from.toISOString().split('T')[0],
                checkOut: range.to ? range.to.toISOString().split('T')[0] : range.from.toISOString().split('T')[0]
            }));
        }
    };

    // ✅ NEW: Handle search/refresh pricing (applies temp values to actual searchParams)
    const handleSearchPricing = () => {
        // Validation
        if (!tempSearchParams.checkIn || !tempSearchParams.checkOut) {
            toast.error("Veuillez sélectionner les dates de séjour", {
                duration: 4000,
                position: 'top-center',
            });
            return;
        }

        // Check if check-in is before check-out
        if (new Date(tempSearchParams.checkIn) >= new Date(tempSearchParams.checkOut)) {
            toast.error("La date de départ doit être après la date d'arrivée", {
                duration: 4000,
                position: 'top-center',
            });
            return;
        }

        // Check if dates are in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(tempSearchParams.checkIn) < today) {
            toast.error("La date d'arrivée ne peut pas être dans le passé", {
                duration: 4000,
                position: 'top-center',
            });
            return;
        }

        // ✅ Apply temp values to actual searchParams
        setSearchParams({
            checkIn: tempSearchParams.checkIn,
            checkOut: tempSearchParams.checkOut,
            rooms: tempSearchParams.rooms
        });

        // Trigger pricing refetch
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

    // ✅ Room management for TEMP state
    const handleAddRoom = () => {
        setTempSearchParams(prev => ({
            ...prev,
            rooms: [...prev.rooms, { adults: 1, children: [] }]
        }));
    };

    const handleRemoveRoom = (index) => {
        if (tempSearchParams.rooms.length === 1) {
            toast.error("Au moins une chambre requise");
            return;
        }
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateRoomAdults = (index, value) => {
        const numValue = parseInt(value);
        if (numValue < 1 || numValue > 6) return;

        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === index ? { ...room, adults: numValue } : room
            )
        }));
    };

    // ✅ Child management
    const handleAddChild = (roomIndex) => {
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) => {
                if (i === roomIndex) {
                    if (room.children.length >= 4) {
                        toast.error("Maximum 4 enfants par chambre");
                        return room;
                    }
                    return {
                        ...room,
                        children: [...room.children, 1]
                    };
                }
                return room;
            })
        }));
    };

    const handleRemoveChild = (roomIndex, childIndex) => {
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) => {
                if (i === roomIndex) {
                    return {
                        ...room,
                        children: room.children.filter((_, ci) => ci !== childIndex)
                    };
                }
                return room;
            })
        }));
    };

    const handleUpdateChildAge = (roomIndex, childIndex, age) => {
        const ageNum = parseInt(age);
        if (ageNum < 1 || ageNum > 11) return;

        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) => {
                if (i === roomIndex) {
                    return {
                        ...room,
                        children: room.children.map((childAge, ci) =>
                            ci === childIndex ? ageNum : childAge
                        )
                    };
                }
                return room;
            })
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

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
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
                                {searchParams.rooms.reduce((sum, room) => sum + room.children.length, 0) > 0 && (
                                    <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                                        {searchParams.rooms.reduce((sum, room) => sum + room.children.length, 0)} enfant{searchParams.rooms.reduce((sum, room) => sum + room.children.length, 0) > 1 ? 's' : ''}
                                    </span>
                                )}
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

                    {/* ✅ Date Picker Expanded with react-day-picker */}
                    {showDatePicker && (
                        <div className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200 shadow-inner">
                            {/* Selected dates display - Full width */}
                            <div className="mb-4 p-3 bg-white rounded-lg border-2 border-sky-200 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block">Date d'arrivée</span>
                                        <span className="text-sm font-bold text-gray-800">{formatDate(tempSearchParams.checkIn)}</span>
                                    </div>
                                    <span className="text-gray-400">→</span>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Date de départ</span>
                                        <span className="text-sm font-bold text-gray-800">{formatDate(tempSearchParams.checkOut)}</span>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold">
                                    {Math.ceil((new Date(tempSearchParams.checkOut) - new Date(tempSearchParams.checkIn)) / (1000 * 60 * 60 * 24))} nuit(s)
                                </div>
                            </div>

                            {/* Side by side layout: Calendar + Rooms */}
                            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                                {/* Left: Calendar */}
                                <div className="w-full lg:w-1/3">
                                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Calendar size={18} className="text-sky-600" />
                                        Sélectionnez vos dates
                                    </label>
                                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                                        {/* ✅ CUSTOM NAVIGATION - Full control */}
                                        <div className="relative">
                                            {/* Custom navigation buttons */}
                                            <div className="flex items-center justify-between mb-3 px-2">
                                                <button
                                                    onClick={() => {
                                                        const newMonth = new Date(currentMonth);
                                                        newMonth.setMonth(newMonth.getMonth() - 1);
                                                        setCurrentMonth(newMonth);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-sky-500 hover:bg-sky-50 text-sky-600 font-bold text-xl transition-all"
                                                    aria-label="Mois précédent"
                                                >
                                                    ‹
                                                </button>

                                                <div className="text-center font-bold text-gray-800 capitalize">
                                                    {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const newMonth = new Date(currentMonth);
                                                        newMonth.setMonth(newMonth.getMonth() + 1);
                                                        setCurrentMonth(newMonth);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-sky-500 hover:bg-sky-50 text-sky-600 font-bold text-xl transition-all"
                                                    aria-label="Mois suivant"
                                                >
                                                    ›
                                                </button>
                                            </div>

                                            {/* DayPicker WITHOUT navigation */}
                                            <DayPicker
                                                mode="range"
                                                selected={dateRange}
                                                onSelect={handleDateRangeSelect}
                                                disabled={(date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    return date < today;
                                                }}
                                                month={currentMonth}
                                                onMonthChange={setCurrentMonth}
                                                numberOfMonths={1}
                                                className="custom-day-picker"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Rooms and Guests */}
                                <div className="w-full lg:w-2/3">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Users size={18} className="text-sky-600" />
                                        Chambres et voyageurs
                                    </h4>
                                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                                        {tempSearchParams.rooms.map((room, index) => (
                                            <div key={index} className="p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-sky-300 transition-all">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                                        <Hotel size={14} className="text-gray-600" />
                                                        Chambre {index + 1}
                                                    </span>
                                                    {tempSearchParams.rooms.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveRoom(index)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Supprimer la chambre"
                                                        >
                                                            <IoTrashOutline size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Adults */}
                                                <div className="mb-3">
                                                    <label className="text-xs text-gray-600 font-semibold mb-1.5 block uppercase tracking-wide">Adultes</label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleUpdateRoomAdults(index, room.adults - 1)}
                                                            disabled={room.adults <= 1}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-sky-500 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-base"
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="6"
                                                            value={room.adults}
                                                            onChange={(e) => handleUpdateRoomAdults(index, e.target.value)}
                                                            className="w-16 px-2 py-1.5 border-2 border-gray-300 rounded-lg text-center font-bold text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateRoomAdults(index, room.adults + 1)}
                                                            disabled={room.adults >= 6}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-sky-500 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-base"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-xs text-gray-600 ml-1 font-medium">adulte(s)</span>
                                                    </div>
                                                </div>

                                                {/* Children */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
                                                            Enfants (1-11 ans)
                                                        </label>
                                                        <button
                                                            onClick={() => handleAddChild(index)}
                                                            disabled={room.children.length >= 4}
                                                            className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 bg-sky-50 hover:bg-sky-100 rounded-lg transition-all"
                                                        >
                                                            <IoAddOutline size={14} />
                                                            Ajouter
                                                        </button>
                                                    </div>

                                                    {room.children.length === 0 ? (
                                                        <p className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 rounded-lg">Aucun enfant</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {room.children.map((childAge, childIndex) => (
                                                                <div key={childIndex} className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                                                    <span className="text-xs text-gray-700 font-semibold min-w-[60px]">
                                                                        Enfant {childIndex + 1}
                                                                    </span>
                                                                    <select
                                                                        value={childAge}
                                                                        onChange={(e) => handleUpdateChildAge(index, childIndex, e.target.value)}
                                                                        className="flex-1 px-2 py-1.5 border-2 border-gray-300 rounded-lg text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all bg-white"
                                                                    >
                                                                        {[...Array(11)].map((_, i) => (
                                                                            <option key={i + 1} value={i + 1}>
                                                                                {i + 1} an{i + 1 > 1 ? 's' : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleRemoveChild(index, childIndex)}
                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Supprimer l'enfant"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {tempSearchParams.rooms.length < 5 && (
                                        <button
                                            onClick={handleAddRoom}
                                            className="w-full mt-3 py-2.5 px-4 border-2 border-dashed border-sky-400 hover:border-sky-600 text-sky-600 hover:bg-sky-50 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <IoAddOutline size={18} />
                                            Ajouter une chambre
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSearchPricing}
                                    disabled={!tempSearchParams.checkIn || !tempSearchParams.checkOut || isLoadingPricing}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
                                    className="px-6 py-3.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
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
                                                searchParams={searchParams}
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
                                                searchParams={searchParams}
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
                                                    Vous avez vu les {sortedHotels.length} hôtel{sortedHotels.length > 1 ? 's' : ''} disponible{sortedHotels.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
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

            {/* ✅ CUSTOM STYLES FOR react-day-picker */}
            <style dangerouslySetInnerHTML={{__html: `
                /* react-day-picker custom styling to match sky-blue theme */
                .custom-day-picker {
                    --rdp-accent-color: #0284c7;
                    --rdp-background-color: #e0f2fe;
                    --rdp-accent-color-dark: #0369a1;
                    --rdp-background-color-dark: #bae6fd;
                    --rdp-outline: 2px solid #0ea5e9;
                    --rdp-outline-selected: 2px solid #0284c7;
                    font-family: inherit;
                }

                .custom-day-picker .rdp-month {
                    margin: 0;
                }

                /* ✅ HIDE DEFAULT NAVIGATION - We use custom buttons */
                .custom-day-picker .rdp-nav {
                    display: none !important;
                }

                .custom-day-picker .rdp-caption {
                    display: flex;
                    justify-content: center;
                    padding: 0.5rem 1rem !important;
                    font-weight: 700;
                    font-size: 1rem;
                    color: #1f2937;
                }

                .custom-day-picker .rdp-head_cell {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: #6b7280;
                    text-transform: uppercase;
                    padding: 0.5rem;
                }

                .custom-day-picker .rdp-day {
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .custom-day-picker .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
                    background: #e0f2fe;
                    color: #0284c7;
                }

                .custom-day-picker .rdp-day_selected {
                    background: #0284c7;
                    color: white;
                    font-weight: 700;
                }
                .custom-day-picker .rdp-months {
                    margin: 0 auto;
                }

                .custom-day-picker .rdp-day_selected:hover {
                    background: #0369a1;
                }

                .custom-day-picker .rdp-day_range_middle {
                    background: #e0f2fe;
                    color: #0284c7;
                }

                .custom-day-picker .rdp-day_disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .custom-day-picker .rdp-day_today:not(.rdp-day_selected) {
                    font-weight: 700;
                    color: #0ea5e9;
                    background: #f0f9ff;
                }

                /* Custom scrollbar for rooms section */
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

                /* Animations */
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

                /* Responsive utility */
                @media (min-width: 375px) {
                    .xs\\:inline {
                        display: inline;
                    }
                }

                /* Responsive calendar */
                @media (max-width: 1024px) {
                    .custom-day-picker .rdp-months {
                        flex-direction: column;
                    }
                }
            `}} />
        </div>
    );
}

export default HotelsPerCityPage;
