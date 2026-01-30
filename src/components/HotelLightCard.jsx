import React, { useState } from "react";
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
    Clock,
    CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

function HotelLightCard({ hotel, onFavoriteToggle }) {
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
        Facilities = [],
        Theme = [],
    } = hotel;

    // Decode HTML entities from description
    const decodeHtml = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    // Handle favorite toggle
    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        onFavoriteToggle?.(Id, !isFavorite);
        toast.success(
            isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
            { duration: 2000 }
        );
    };

    // Navigate to hotel details
    const handleCardClick = () => {
        navigate(`/hotel/${Id}`);
    };

    const handleViewAvailability = (e) => {
        e.stopPropagation();
        navigate(`/hotels/${Id}`);
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

    // Mock pricing data (you would get this from API)
    const pricing = {
        originalPrice: "32 364",
        currentPrice: "16 182",
        currency: "DZD",
        nights: 3,
        adults: 2,
    };

    // Calculate discount percentage
    const discountPercent = Math.round(
        ((parseFloat(pricing.originalPrice.replace(/\s/g, "")) -
                parseFloat(pricing.currentPrice.replace(/\s/g, ""))) /
            parseFloat(pricing.originalPrice.replace(/\s/g, ""))) *
        100
    );

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
                            src={Image}
                            alt={Name}
                            onLoad={() => setImageLoaded(true)}
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

                    {/* Limited Offer Badge */}
                    {discountPercent > 0 && (
                        <div className="absolute top-4 left-4 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow-lg">
                            Offre à Durée Limitée
                        </div>
                    )}

                    {/* Theme Tags (Bottom Left) */}
                    {Theme.length > 0 && (
                        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                            {Theme.slice(0, 2).map((theme, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm"
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
                                        {City?.Name}, {City?.Country?.Name}
                                    </span>
                                    <button className="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline">
                                        Indiquer sur la carte
                                    </button>
                                </div>

                                {/* Distance Info */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                    <span className="font-semibold">2,3 km du centre</span>
                                    <span className="text-gray-400">•</span>
                                    <span>Proche du métro</span>
                                </div>

                                {/* Stars */}
                                {Category?.Star && (
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(Category.Star)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={18}
                                                fill="#f97316"
                                                className="text-orange-500"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Rating Badge */}
                            <div className="flex flex-col items-end ml-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-800">
                                            Exceptionnel
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            3 expériences vécues
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-sky-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-lg">
                                        10
                                    </div>
                                </div>
                                <div className="mt-2 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded shadow-md">
                                    Nouveau sur Booking.com
                                </div>
                            </div>
                        </div>

                        {/* Room Type Info */}
                        <div className="mb-4 p-4 bg-sky-50 rounded-xl border-2 border-sky-100">
                            <div className="font-bold text-gray-800 mb-2">
                                Chambre Quadruple
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                2 très grands lits doubles
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong>Aucun prépaiement requis</strong> – Payez sur place
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-red-600 font-semibold">
                                Plus que 1 hébergement à ce prix sur notre site
                            </div>
                        </div>

                        {/* Facilities */}
                        <div className="flex flex-wrap gap-3 mb-4">
                            {topFacilities.map((facility, index) => {
                                const Icon = getFacilityIcon(facility.Title);
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-all"
                                    >
                                        <Icon size={16} className="text-sky-600" />
                                        <span className="font-medium">{facility.Title}</span>
                                    </div>
                                );
                            })}
                            {Facilities.length > 4 && (
                                <button className="px-3 py-2 text-sm text-sky-600 hover:text-sky-700 font-semibold hover:bg-sky-50 rounded-lg transition-all">
                                    +{Facilities.length - 4} équipements
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer Section - Pricing & CTA */}
                    <div className="border-t-2 border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-end justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">
                                    {pricing.nights} nuits, {pricing.adults} adultes
                                </div>
                                {discountPercent > 0 && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm text-gray-400 line-through">
                                            {pricing.currency} {pricing.originalPrice}
                                        </span>
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                            -{discountPercent}%
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-800">
                                        {pricing.currency} {pricing.currentPrice}
                                    </span>
                                    <button
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Taxes et frais compris"
                                    >
                                        <Info size={18} />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Taxes et frais compris
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={handleViewAvailability}
                                className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 group"
                            >
                                Voir les disponibilités
                                <ChevronRight
                                    size={20}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HotelLightCard;
