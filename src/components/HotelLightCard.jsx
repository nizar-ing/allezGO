import React, { useState, useMemo } from "react";
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
    Info,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";

function HotelLightCard({
                            hotel,
                            onFavoriteToggle,
                            pricing = null,           // ✅ NEW: Pre-calculated pricing from parent
                            onBook = null,            // ✅ NEW: Booking handler
                            onViewDetail = null,      // ✅ NEW: View detail handler
                            showBookButton = false,   // ✅ NEW: Show booking button
                            nights = 1,               // ✅ NEW: Number of nights from parent
                            searchParams = null       // OPTIONAL: For backward compatibility
                        }) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

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

    // Get guest count from search params (if available)
    const guestInfo = useMemo(() => {
        if (!searchParams?.rooms || searchParams.rooms.length === 0) {
            return { adults: 1, children: 0, totalGuests: 1 };
        }

        const adults = searchParams.rooms.reduce((sum, room) => sum + (room.adults || 0), 0);
        const children = searchParams.rooms.reduce((sum, room) => sum + (room.children?.length || 0), 0);

        return {
            adults,
            children,
            totalGuests: adults + children
        };
    }, [searchParams]);

    // Format price with thousands separator
    const formatPrice = (price) => {
        if (!price) return "0";
        return new Intl.NumberFormat('fr-DZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    };

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

    // ✅ Navigate to hotel detail page - FIXED URL
    const handleCardClick = () => {
        if (onViewDetail) {
            onViewDetail(Id);
        } else {
            navigate(`/hotels/${Id}`, {
                state: { hotel, searchParams }
            });
        }
    };

    // ✅ Handle booking action
    const handleBookingClick = (e) => {
        e.stopPropagation();
        // if (onBook) {
        //     onBook();
        // } else {
        //     // Fallback: navigate to hotel detail
        //     navigate(`/hotels/${Id}`, {
        //         state: { hotel, searchParams }
        //     });
        // }
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
        <div
            onClick={handleCardClick}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group border-2 border-transparent hover:border-sky-200"
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

                                {/* ✅ Pricing Display */}
                                {pricing && pricing.minPrice ? (
                                    <>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-3xl font-bold text-gray-800">
                                                {formatPrice(pricing.minPrice)}
                                            </span>
                                            <span className="text-lg font-semibold text-gray-600">
                                                {pricing.currency}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">
                                                Taxes et frais compris
                                            </span>
                                            <button
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Prix total pour le séjour"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>
                                        <div className="text-xs text-green-600 font-semibold mt-1">
                                            ✓ Meilleur prix disponible
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

                            {/* ✅ CTA Buttons */}
                            <div className="flex flex-col gap-2">
                                {showBookButton && pricing && pricing.minPrice ? (
                                    <>
                                        {/* Primary: Book Now */}
                                        <button
                                            onClick={handleBookingClick}
                                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 group/btn whitespace-nowrap"
                                        >
                                            Réserver maintenant
                                            <ChevronRight
                                                size={18}
                                                className="group-hover/btn:translate-x-1 transition-transform"
                                            />
                                        </button>
                                        {/* Secondary: View Details */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCardClick();
                                            }}
                                            className="px-6 py-2 bg-white hover:bg-sky-50 text-sky-600 border-2 border-sky-600 font-semibold text-sm rounded-xl transition-all duration-300 whitespace-nowrap"
                                        >
                                            Voir les détails
                                        </button>
                                    </>
                                ) : (
                                    /* Fallback: View Availability */
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
    );
}

export default HotelLightCard;
