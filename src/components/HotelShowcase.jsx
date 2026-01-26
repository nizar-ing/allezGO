import React, { useMemo } from "react";
import { FaCrown, FaDollarSign, FaUsers, FaUtensils, FaHotel } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import HotelCard from "./HotelCard.jsx";
import HotelCarousel from "../ui/HotelCarrousel.jsx";
import Loader from "../ui/Loader.jsx";
import { useHotelsEnhanced } from "../custom-hooks/useHotelQueries.js";

function HotelShowcase({ cityId = null, className = "" }) {
    const { data: hotels, isLoading, error } = useHotelsEnhanced(cityId, { batchSize: 5 });

    const hotelCategories = useMemo(() => {
        if (!hotels || hotels.length === 0) return null;

        const luxuryHotels = [...hotels]
            .filter(h => h.Category?.Star >= 4)
            .sort((a, b) => (b.Category?.Star || 0) - (a.Category?.Star || 0))
            .slice(0, 6)
            .map(h => ({ ...h, id: h.Id }));

        const budgetHotels = [...hotels]
            .filter(h => h.Category?.Star <= 3)
            .sort((a, b) => (a.Category?.Star || 0) - (b.Category?.Star || 0))
            .slice(0, 6)
            .map(h => ({ ...h, id: h.Id }));

        const familyHotels = hotels
            .filter(h =>
                h.Theme?.some(theme =>
                    theme.toLowerCase().includes('famille') ||
                    theme.toLowerCase().includes('family')
                ) ||
                h.Tag?.some(tag =>
                    tag.Title?.toLowerCase().includes('famille') ||
                    tag.Title?.toLowerCase().includes('family')
                )
            )
            .slice(0, 6)
            .map(h => ({ ...h, id: h.Id }));

        const allInclusiveHotels = hotels
            .filter(h =>
                h.Boarding?.some(board =>
                    board.Name?.toLowerCase().includes('all inclusive') ||
                    board.Name?.toLowerCase().includes('tout compris') ||
                    board.Code?.toLowerCase().includes('ai') ||
                    board.Code?.toLowerCase().includes('tc')
                )
            )
            .slice(0, 6)
            .map(h => ({ ...h, id: h.Id }));

        return { luxuryHotels, budgetHotels, familyHotels, allInclusiveHotels };
    }, [hotels]);

    if (isLoading) {
        return <Loader message="Chargement des collections d'hôtels..." />;
    }

    if (error) return <ErrorState error={error} />;
    if (!hotelCategories) return <EmptyState />;

    const categories = [
        {
            title: "Hôtels de Luxe",
            subtitle: "Les établissements prestigieux",
            icon: <FaCrown />,
            iconBg: "from-amber-400 via-yellow-500 to-orange-500",
            hotels: hotelCategories.luxuryHotels,
            badgeColor: "from-amber-100 to-orange-100 text-amber-800 border-amber-300",
            accentColor: "bg-amber-500"
        },
        {
            title: "Petits Prix",
            subtitle: "Économique sans compromis",
            icon: <FaDollarSign />,
            iconBg: "from-green-400 via-emerald-500 to-teal-500",
            hotels: hotelCategories.budgetHotels,
            badgeColor: "from-green-100 to-emerald-100 text-green-800 border-green-300",
            accentColor: "bg-green-500"
        },
        {
            title: "Pour la Famille",
            subtitle: "Vacances en famille",
            icon: <FaUsers />,
            iconBg: "from-pink-400 via-rose-500 to-red-500",
            hotels: hotelCategories.familyHotels,
            badgeColor: "from-pink-100 to-rose-100 text-pink-800 border-pink-300",
            accentColor: "bg-pink-500"
        },
        {
            title: "Tout Compris",
            subtitle: "Sans souci",
            icon: <FaUtensils />,
            iconBg: "from-purple-400 via-indigo-500 to-blue-500",
            hotels: hotelCategories.allInclusiveHotels,
            badgeColor: "from-purple-100 to-indigo-100 text-purple-800 border-purple-300",
            accentColor: "bg-purple-500"
        }
    ];

    return (
        <section className={`w-full py-2 md:py-6 lg:py-8 bg-gradient-to-b from-sky-50 via-white to-gray-50 ${className}`}>
            <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:max-w-7xl 2xl:max-w-[1600px]">
                {/* Main Header */}
                <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-14">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="hidden md:block p-3 sm:p-3.5 md:p-4 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl sm:rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105">
                            <FaHotel className="text-white w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9" />
                        </div>

                        <h1 className="hidden md:block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 bg-clip-text text-transparent leading-tight">
                            Nos Collections d'Hôtels
                        </h1>
                    </div>
                </div>

                {/* Category Sections */}
                <div className="space-y-6 sm:space-y-8 md:space-y-10">
                    {categories.map((category, idx) =>
                            category.hotels.length > 0 && (
                                <CategorySection key={idx} {...category} />
                            )
                    )}
                </div>
            </div>
        </section>
    );
}

function CategorySection({ title, subtitle, icon, iconBg, hotels, badgeColor, accentColor }) {
    return (
        <div className="w-full">
            {/* Mobile Layout */}
            <div className="flex flex-col items-center text-center gap-3 mb-5 sm:hidden">
                <div className="flex items-center justify-center gap-2.5 w-full">
                    <div className={`p-2.5 bg-gradient-to-br ${iconBg} rounded-xl shadow-lg flex-shrink-0`}>
                        {React.cloneElement(icon, { className: "text-white w-5 h-5" })}
                    </div>
                    <h2 className="text-xl font-bold text-gray-600 truncate">
                        {title}
                    </h2>
                </div>
                <p className="text-gray-600 text-sm w-full px-2">
                    {subtitle}
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${badgeColor} rounded-full border-2 font-bold text-sm shadow-md`}>
                    <HiSparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{hotels.length} hôtel{hotels.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className={`p-3 md:p-3.5 lg:p-4 bg-gradient-to-br ${iconBg} rounded-xl lg:rounded-2xl shadow-lg flex-shrink-0`}>
                        {React.cloneElement(icon, { className: "text-white w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" })}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">
                            {title}
                        </h2>
                        <p className="text-gray-600 text-sm md:text-base lg:text-lg truncate">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-2 md:py-2.5 bg-gradient-to-r ${badgeColor} rounded-full border-2 font-bold text-sm md:text-base shadow-md flex-shrink-0`}>
                    <HiSparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="whitespace-nowrap">{hotels.length} hôtel{hotels.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* FIXED: Carousel with proper overflow handling for navigation buttons */}
            <div className="relative w-full overflow-visible">
                <HotelCarousel
                    items={hotels}
                    itemsPerView={{
                        mobile: 1,
                        tablet: 2,
                        desktop: 3
                    }}
                    renderItem={(hotel) => <HotelCard hotel={hotel} />}
                    gap="gap-4 sm:gap-5 lg:gap-6"
                    accentColor={accentColor}
                    showArrows={true}
                    showIndicators={true}
                />
            </div>
        </div>
    );
}

function ErrorState({ error }) {
    return (
        <div className="w-full min-h-[300px] sm:min-h-[400px] flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4 py-8">
            <div className="text-center max-w-md mx-auto w-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-red-600 text-3xl sm:text-4xl font-bold">⚠</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    Erreur
                </h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    {error?.message || "Impossible de charger les hôtels"}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-bold hover:from-sky-700 hover:to-blue-700 transition-all shadow-lg text-sm sm:text-base active:scale-95"
                >
                    Réessayer
                </button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="w-full min-h-[300px] sm:min-h-[400px] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-8">
            <div className="text-center max-w-md mx-auto w-full">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaHotel className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    Aucun hôtel disponible
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                    Nous n'avons pas d'hôtels à afficher
                </p>
            </div>
        </div>
    );
}

export default HotelShowcase;
