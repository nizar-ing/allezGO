import  { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Heart,
    MapPin,
    Star,
    Wifi,
    Car,
    Utensils,
    Waves,
    Wind,
    Coffee,
    Dumbbell,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Users,
    ChevronDown,
    ChevronUp,
    X,
    Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";

function HotelLightCard({
                            hotel,
                            onFavoriteToggle,
                            pricing = null,
                            onBook = null,
                            onViewDetail = null,
                            showBookButton = false,
                            nights = 1,
                            searchParams = null
                        }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showTarifs, setShowTarifs] = useState(false);
    const [selectedBoarding, setSelectedBoarding] = useState("petit-dejeuner");
    const [selectedRoomType, setSelectedRoomType] = useState("double");

    // ✅ API state for real pricing
    const [apiPrice, setApiPrice] = useState(null);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);

    const {
        Id,
        Name,
        Category,
        City,
        ShortDescription,
        Image,
        Album = [],
        Facilities = [],
        Theme = [],
        Description,
    } = hotel;

    // ✅ Use first album image or fallback to Image property
    const hotelImage = useMemo(() => {
        if (Album && Album.length > 0) {
            return Album[0];
        }
        return Image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
    }, [Album, Image]);

    // ✅ Get guest count from search params
    const guestInfo = useMemo(() => {
        if (!searchParams?.rooms || searchParams.rooms.length === 0) {
            return { adults: 2, children: 0, totalGuests: 2 };
        }

        const adults = searchParams.rooms.reduce((sum, room) => sum + (room.adults || 0), 0);
        const children = searchParams.rooms.reduce((sum, room) => {
            if (Array.isArray(room.children)) {
                return sum + room.children.length;
            }
            return sum;
        }, 0);

        return {
            adults,
            children,
            totalGuests: adults + children
        };
    }, [searchParams]);

    // ✅ Boarding options with API codes
    const boardingOptions = [
        { id: "petit-dejeuner", label: "Logement Petit Déjeuner", priceMultiplier: 1, code: "BB" },
        { id: "demi-pension", label: "Demi Pension", priceMultiplier: 1.3, code: "HB" },
        { id: "all-inclusive", label: "Soft All Inclusive", priceMultiplier: 1.6, code: "AI" },
    ];

    // ✅ Room types - ONLY SINGLE AND DOUBLE
    const roomTypes = [
        { id: "single", label: "Chambre Single" },
        { id: "double", label: "Chambre Double" },
    ];

    // Format price with thousands separator
    const formatPrice = (price) => {
        if (!price) return "0";
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    };

    // ✅ Fetch price from API when room type or boarding changes
    useEffect(() => {
        if (showTarifs && searchParams?.checkIn && searchParams?.checkOut) {
            fetchPriceFromAPI();
        }
    }, [selectedRoomType, selectedBoarding, showTarifs]);

    // ✅ Fetch price from API
    const fetchPriceFromAPI = async () => {
        if (!searchParams?.checkIn || !searchParams?.checkOut) {
            console.log('⚠️ No search dates available');
            return;
        }

        setIsLoadingPrice(true);
        try {
            const currentBoarding = boardingOptions.find(opt => opt.id === selectedBoarding);

            const roomConfig = selectedRoomType === 'single'
                ? [{ adults: 1, children: 0 }]
                : [{ adults: 2, children: 0 }];

            console.log('========================================');
            console.log('🔍 FETCHING PRICE');
            console.log('Hotel ID:', Id);
            console.log('Hotel Name:', Name);
            console.log('Check-in:', searchParams.checkIn);
            console.log('Check-out:', searchParams.checkOut);
            console.log('Room Type:', selectedRoomType);
            console.log('Boarding:', currentBoarding.code);
            console.log('Room Config:', roomConfig);
            console.log('========================================');

            const response = await apiClient.searchRoomAvailability({
                hotelId: Id,
                checkIn: searchParams.checkIn,
                checkOut: searchParams.checkOut,
                rooms: roomConfig,
            });

            console.log('📦 RAW API RESPONSE:', JSON.stringify(response, null, 2));

            if (response.errorMessage && response.errorMessage.length > 0) {
                console.log('⚠️ API ERROR MESSAGES:', response.errorMessage);
            }

            if (!response.rooms || response.rooms.length === 0) {
                console.log('❌ API RETURNED ZERO ROOMS');
                console.log('This hotel has NO availability for these dates/criteria');
                console.log('💡 Will use fallback pricing with room type differentiation');
                setApiPrice(null);
                return;
            }

            console.log('✅ API RETURNED', response.rooms.length, 'ROOMS');
            console.log('🛏️ ALL ROOMS:', response.rooms);

            // Find matching room
            let matchedRoom = response.rooms.find(room =>
                room.boardingCode === currentBoarding.code
            );

            if (!matchedRoom) {
                console.log('⚠️ No room with boarding', currentBoarding.code);
                console.log('Available boarding types:', response.rooms.map(r => r.boardingCode));
                matchedRoom = response.rooms[0];
            } else {
                console.log('✅ Found room with boarding', currentBoarding.code);
            }

            console.log('💰 SELECTED ROOM:', {
                name: matchedRoom.name,
                price: matchedRoom.price,
                currency: matchedRoom.currency,
                boarding: matchedRoom.boardingName,
                boardingCode: matchedRoom.boardingCode
            });

            setApiPrice(matchedRoom.price);
        } catch (error) {
            console.error("❌ ERROR:", error);
            setApiPrice(null);
        } finally {
            setIsLoadingPrice(false);
        }
    };

    // ✅ IMPROVED: Different prices for Single vs Double even without API
    const displayPrice = useMemo(() => {
        // Use API price if available
        if (apiPrice !== null) {
            console.log('💰 Using API price:', apiPrice);
            return apiPrice;
        }

        // FALLBACK: Calculate price based on room type + boarding
        if (!pricing?.minPrice) return 0;

        const selectedOption = boardingOptions.find(opt => opt.id === selectedBoarding);
        const basePrice = pricing.minPrice * (selectedOption?.priceMultiplier || 1);

        // ✅ Apply room type multiplier
        // Single room = 70% of base price (1 person)
        // Double room = 100% of base price (2 people)
        const roomTypeMultiplier = selectedRoomType === 'single' ? 0.7 : 1.0;

        const finalPrice = basePrice * roomTypeMultiplier;

        console.log('💰 Using FALLBACK price calculation:', {
            basePrice: pricing.minPrice,
            boarding: selectedOption?.label,
            boardingMultiplier: selectedOption?.priceMultiplier,
            roomType: selectedRoomType,
            roomTypeMultiplier,
            finalPrice
        });

        return finalPrice;
    }, [apiPrice, pricing, selectedBoarding, selectedRoomType]);

    // Handle favorite toggle
    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        onFavoriteToggle?.(Id, !isFavorite);
        toast.success(
            isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
            { duration: 2000, icon: isFavorite ? "💔" : "❤️" }
        );
    };

    // ✅ Navigate to hotel detail page
    const handleCardClick = () => {
        if (showTarifs) return; // Don't navigate if tarifs section is open

        if (onViewDetail) {
            onViewDetail(Id);
        } else {
            navigate(`/hotels/${Id}`, {
                state: { hotel, searchParams }
            });
        }
    };

    // ✅ Toggle tarifs section
    const handleTarifsClick = (e) => {
        e.stopPropagation();
        setShowTarifs(!showTarifs);
    };

    // ✅ Handle reservation
    const handleReservation = (e) => {
        e.stopPropagation();

        if (onBook) {
            onBook();
        } else {
            navigate(`/hotels/${Id}`, {
                state: {
                    hotel,
                    searchParams,
                    selectedBoarding: boardingOptions.find(opt => opt.id === selectedBoarding)?.code,
                    selectedRoomType,
                    price: displayPrice
                }
            });
        }
    };

    // Get facility icon
    const getFacilityIcon = (facilityTitle) => {
        const title = facilityTitle.toLowerCase();
        if (title.includes("wifi") || title.includes("internet")) return Wifi;
        if (title.includes("parking")) return Car;
        if (title.includes("restaurant") || title.includes("bar")) return Utensils;
        if (title.includes("piscine") || title.includes("plage")) return Waves;
        if (title.includes("climatisation")) return Wind;
        if (title.includes("café") || title.includes("petit")) return Coffee;
        if (title.includes("sport") || title.includes("gym")) return Dumbbell;
        if (title.includes("spa") || title.includes("bien-être")) return Sparkles;
        return CheckCircle2;
    };

    // Get top 4 facilities for display
    const topFacilities = Facilities.slice(0, 4);

    // Get short description (max 150 chars)
    const shortDesc = useMemo(() => {
        const desc = ShortDescription || Description || "";
        if (desc.length <= 150) return desc;
        return desc.substring(0, 150) + "...";
    }, [ShortDescription, Description]);

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-sky-200">
            <div
                onClick={handleCardClick}
                className="cursor-pointer"
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                    {/* Left Side - Image */}
                    <div className="md:col-span-4 relative h-64 md:h-full min-h-[250px]">
                        {/* Image Container */}
                        <div className="relative w-full h-full overflow-hidden">
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-100 animate-pulse"></div>
                            )}
                            <img
                                src={hotelImage}
                                alt={Name}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                    e.target.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
                                    setImageLoaded(true);
                                }}
                                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                                    imageLoaded ? "opacity-100" : "opacity-0"
                                }`}
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Favorite Button */}
                        <button
                            onClick={handleFavoriteClick}
                            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 hover:bg-white transition-all duration-300 z-10"
                            aria-label="Ajouter aux favoris"
                        >
                            <Heart
                                size={20}
                                className={`transition-all duration-300 ${
                                    isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : "text-gray-600 hover:text-red-500"
                                }`}
                            />
                        </button>

                        {/* ✅ Available Badge */}
                        {pricing && pricing.available && (
                            <div className="absolute top-4 left-4 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2">
                                <CheckCircle2 size={14} />
                                Disponible
                            </div>
                        )}

                        {/* Theme Tags (Bottom Left) */}
                        {Theme.length > 0 && (
                            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                                {Theme.slice(0, 2).map((theme, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg"
                                    >
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Side - Content */}
                    <div className="md:col-span-8 flex flex-col">
                        <div className="flex-1 p-6">
                            {/* Header Section */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    {/* Hotel Name */}
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-sky-600 transition-colors">
                                        {Name}
                                    </h3>

                                    {/* Location */}
                                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                                        <MapPin size={16} className="text-sky-600 flex-shrink-0" />
                                        <span className="text-sm">
                                            {City?.Name || "Localisation"}{City?.Country?.Name && `, ${City.Country.Name}`}
                                        </span>
                                    </div>

                                    {/* Stars */}
                                    {Category?.Star && (
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(Category.Star)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    fill="#f97316"
                                                    className="text-orange-500"
                                                />
                                            ))}
                                            <span className="ml-2 text-sm text-gray-600 font-medium">
                                                {Category.Star} étoiles
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Rating Badge */}
                                {Category?.Star && (
                                    <div className="flex flex-col items-end ml-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-red-500 text-white font-bold text-xl rounded-xl flex items-center justify-center shadow-lg">
                                            {Category.Star}★
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {Category.Title || "Hôtel"}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {shortDesc && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {shortDesc}
                                </p>
                            )}

                            {/* Facilities */}
                            {topFacilities.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {topFacilities.map((facility, index) => {
                                        const Icon = getFacilityIcon(facility.Title);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-all"
                                                title={facility.Title}
                                            >
                                                <Icon size={16} className="text-sky-600" />
                                                <span className="font-medium truncate max-w-[120px]">
                                                    {facility.Title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {Facilities.length > 4 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCardClick();
                                            }}
                                            className="px-3 py-2 text-sm text-sky-600 hover:text-sky-700 font-semibold hover:bg-sky-50 rounded-lg transition-all"
                                        >
                                            +{Facilities.length - 4} autres
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Section - Pricing & CTA */}
                        <div className="border-t-2 border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex-1">
                                    {/* Stay Info */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{nights} nuit{nights > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users size={14} />
                                            <span>
                                                {guestInfo.adults} adulte{guestInfo.adults > 1 ? 's' : ''}
                                                {guestInfo.children > 0 && `, ${guestInfo.children} enfant${guestInfo.children > 1 ? 's' : ''}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pricing Display */}
                                    {pricing && pricing.minPrice ? (
                                        <>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs text-gray-500">à partir de</span>
                                                <span className="text-3xl font-bold text-gray-800">
                                                    {formatPrice(pricing.minPrice)}
                                                </span>
                                                <span className="text-lg font-semibold text-gray-600">
                                                    {pricing.currency}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">
                                                    Logement Petit Déjeuner
                                                </span>
                                            </div>
                                        </>
                                    ) : pricing && !pricing.available ? (
                                        <div className="flex items-center gap-2 text-orange-600">
                                            <AlertCircle size={20} />
                                            <span className="font-semibold">Non disponible pour ces dates</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-xl font-bold text-gray-600 mb-1">
                                                Prix sur demande
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Sélectionnez des dates pour voir les prix
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <div className="flex flex-col gap-2">
                                    {showBookButton && pricing && pricing.minPrice ? (
                                        <button
                                            onClick={handleTarifsClick}
                                            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 group/btn whitespace-nowrap"
                                        >
                                            Tarifs & Chambres
                                            {showTarifs ? (
                                                <ChevronUp size={18} className="transition-transform" />
                                            ) : (
                                                <ChevronDown size={18} className="transition-transform" />
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCardClick}
                                            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 group/btn whitespace-nowrap"
                                        >
                                            Voir les disponibilités
                                            <ChevronRight
                                                size={18}
                                                className="group-hover/btn:translate-x-1 transition-transform"
                                            />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ EXPANDABLE TARIFS & CHAMBRES SECTION */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    showTarifs ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="border-t-4 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-6">
                    {/* Header with close button */}
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-6 bg-sky-600 rounded-full"></span>
                            Choisissez votre formule et chambre(s)
                        </h4>
                        <button
                            onClick={handleTarifsClick}
                            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            title="Fermer"
                        >
                            <X size={24} className="text-white font-bold" />
                        </button>
                    </div>

                    {/* Boarding Type Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {boardingOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedBoarding(option.id)}
                                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                    selectedBoarding === option.id
                                        ? 'bg-sky-600 text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-700 hover:bg-sky-100 border-2 border-gray-200'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Room Selection */}
                    <div className="bg-white rounded-xl p-5 shadow-md border-2 border-sky-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-800">
                                    Chambre 1: {guestInfo.adults} adulte{guestInfo.adults > 1 ? 's' : ''}
                                    {guestInfo.children > 0 && `, ${guestInfo.children} enfant${guestInfo.children > 1 ? 's' : ''}`}
                                </span>
                                <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                                    Info
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                Disponible
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            {/* Room Type Dropdown */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                    Type de chambre
                                </label>
                                <select
                                    value={selectedRoomType}
                                    onChange={(e) => setSelectedRoomType(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all cursor-pointer hover:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={isLoadingPrice}
                                >
                                    {roomTypes.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price per room - WITH API INTEGRATION */}
                            <div className="text-right">
                                {isLoadingPrice ? (
                                    <div className="flex items-center justify-end gap-2">
                                        <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                                        <span className="text-sm text-gray-600">Chargement...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {boardingOptions.find(opt => opt.id === selectedBoarding)?.label}
                                        </div>
                                        <div className="text-2xl font-black text-gray-800">
                                            {formatPrice(displayPrice)}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Total and Reserve Button */}
                    <div className="mt-6 flex items-center justify-between p-4 bg-white rounded-xl border-2 border-sky-200 shadow-md">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">
                                Montant total du séjour:
                            </div>
                            <div className="text-3xl font-black text-gray-800">
                                {formatPrice(displayPrice)} {pricing?.currency || 'DZD'}
                            </div>
                        </div>
                        <button
                            onClick={handleReservation}
                            disabled={isLoadingPrice}
                            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Réserver
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HotelLightCard;
