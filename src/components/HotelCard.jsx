import React from "react";
import { MdLocationOn, MdEmail, MdPhone, MdStar } from "react-icons/md";
import { BsImages } from "react-icons/bs";
import { AiOutlineEye } from "react-icons/ai";
import { HiSparkles } from "react-icons/hi";
import {
    IoRestaurantOutline,
    IoWifiOutline,
    IoFitnessOutline,
    IoCarSportOutline,
    IoWaterOutline
} from "react-icons/io5";
import {
    FaSpa,
    FaSwimmingPool,
    FaConciergeBell,
    FaUmbrellaBeach,
    FaChild,
    FaHeart,
    FaMountain,
    FaCity,
    FaTree
} from "react-icons/fa";
import { MdFamilyRestroom, MdBusinessCenter, MdBeachAccess } from "react-icons/md";
import { Link } from "react-router-dom";

/**
 * Premium HotelCard - With Beautiful Badges
 */
function HotelCard({ hotel, className = "" }) {
    if (!hotel) return null;

    const {
        Id,
        Name,
        Category,
        City,
        ShortDescription,
        Adress,
        Image,
        Album = [],
        Facilities = [],
        Tag = [],
        Boarding = [],
        Theme = [],
        Email,
        Phone,
        _enhanced,
    } = hotel;

    const primaryBoarding = Boarding?.[0];
    const topFacilities = Facilities.slice(0, 4);
    const topThemes = Theme.slice(0, 3);
    const primaryTag = Tag?.[0];
    const cleanDescription = ShortDescription?.replace(/<[^>]*>/g, "") || "";

    // Facility icon mapper
    const getFacilityIcon = (title) => {
        const lowerTitle = title?.toLowerCase() || "";

        if (lowerTitle.includes("wifi") || lowerTitle.includes("internet"))
            return <IoWifiOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("piscine") || lowerTitle.includes("pool"))
            return <FaSwimmingPool className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("spa") || lowerTitle.includes("wellness"))
            return <FaSpa className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("parking") || lowerTitle.includes("garage"))
            return <IoCarSportOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("fitness") || lowerTitle.includes("gym") || lowerTitle.includes("sport"))
            return <IoFitnessOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("restaurant") || lowerTitle.includes("bar"))
            return <IoRestaurantOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("plage") || lowerTitle.includes("beach"))
            return <FaUmbrellaBeach className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
        if (lowerTitle.includes("concierge") || lowerTitle.includes("service"))
            return <FaConciergeBell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;

        return <HiSparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
    };

    // Theme icon and color mapper
    const getThemeStyle = (theme) => {
        const lowerTheme = theme?.toLowerCase() || "";

        if (lowerTheme.includes("famille") || lowerTheme.includes("family"))
            return {
                icon: <MdFamilyRestroom className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-pink-500 to-rose-500",
                bg: "from-pink-50 to-rose-50",
                border: "border-pink-200"
            };
        if (lowerTheme.includes("business") || lowerTheme.includes("affaire"))
            return {
                icon: <MdBusinessCenter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-slate-600 to-gray-700",
                bg: "from-slate-50 to-gray-50",
                border: "border-slate-300"
            };
        if (lowerTheme.includes("plage") || lowerTheme.includes("beach"))
            return {
                icon: <MdBeachAccess className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-cyan-500 to-blue-500",
                bg: "from-cyan-50 to-blue-50",
                border: "border-cyan-200"
            };
        if (lowerTheme.includes("romance") || lowerTheme.includes("couple"))
            return {
                icon: <FaHeart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-red-500 to-pink-500",
                bg: "from-red-50 to-pink-50",
                border: "border-red-200"
            };
        if (lowerTheme.includes("montagne") || lowerTheme.includes("mountain"))
            return {
                icon: <FaMountain className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-emerald-600 to-teal-600",
                bg: "from-emerald-50 to-teal-50",
                border: "border-emerald-300"
            };
        if (lowerTheme.includes("ville") || lowerTheme.includes("city"))
            return {
                icon: <FaCity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-indigo-500 to-purple-500",
                bg: "from-indigo-50 to-purple-50",
                border: "border-indigo-200"
            };
        if (lowerTheme.includes("nature") || lowerTheme.includes("eco"))
            return {
                icon: <FaTree className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
                gradient: "from-green-600 to-lime-600",
                bg: "from-green-50 to-lime-50",
                border: "border-green-300"
            };

        return {
            icon: <HiSparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
            gradient: "from-purple-500 to-indigo-500",
            bg: "from-purple-50 to-indigo-50",
            border: "border-purple-200"
        };
    };

    return (
        <article
            className={`
        group bg-white rounded-xl sm:rounded-2xl overflow-hidden 
        border border-gray-200 hover:border-sky-300
        shadow-md hover:shadow-xl lg:hover:shadow-2xl
        h-full flex flex-col
        w-full max-w-[340px] sm:max-w-none mx-auto
        transition-all duration-500 ease-out
        transform hover:-translate-y-2
        ${className}
      `}
        >
            {/* Image Section */}
            <div className="relative h-48 sm:h-52 md:h-60 lg:h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-sky-50">
                <img
                    src={Image}
                    alt={Name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/e5e7eb/9ca3af?text=Hotel";
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Premium Badge */}
                {_enhanced && (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl border-2 border-white/30">
                            <HiSparkles className="w-3 h-3" />
                            <span>Premium</span>
                        </div>
                    </div>
                )}

                {/* Photo Count */}
                {Album.length > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold border border-white/20">
                            <BsImages className="w-3 h-3" />
                            <span>{Album.length}</span>
                        </div>
                    </div>
                )}

                {/* Star Rating */}
                <div className="absolute bottom-2 left-2 z-10">
                    <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-lg border border-white/50">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <MdStar
                                    key={i}
                                    className={`w-3 h-3 ${
                                        i < (Category?.Star || 0) ? "text-amber-400" : "text-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-800">{Category?.Star}★</span>
                    </div>
                </div>

                {/* Primary Tag */}
                {primaryTag && (
                    <div className="absolute bottom-2 right-2 z-10">
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white/30">
              {primaryTag.Title}
            </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col">
                {/* Hotel Name */}
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-sky-600 transition-colors line-clamp-2 leading-tight">
                    {Name}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                    <div className="bg-gradient-to-br from-sky-100 to-blue-100 p-1.5 rounded-lg shrink-0 shadow-sm">
                        <MdLocationOn className="text-sky-600 w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">
                            {City?.Name}, {City?.Country?.Name}
                        </p>
                        {Adress && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1" title={Adress}>
                                {Adress}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                {cleanDescription && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed hidden sm:block">
                        {cleanDescription}
                    </p>
                )}

                {/* Boarding - Enhanced */}
                {primaryBoarding && (
                    <div className="mb-3">
                        <div className="relative overflow-hidden rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-2.5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-2xl"></div>
                            <div className="relative flex items-center gap-2">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                    <IoRestaurantOutline className="text-emerald-600 w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-emerald-800 line-clamp-1">
                                        {primaryBoarding.Name}
                                    </p>
                                    <p className="text-xs text-emerald-600 font-semibold">
                                        {primaryBoarding.Code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Premium Facility Badges */}
                {topFacilities.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Équipements
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {topFacilities.map((facility, index) => (
                                <div
                                    key={index}
                                    className="group/badge relative inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-sky-300 rounded-lg text-xs font-semibold text-gray-700 hover:text-sky-700 transition-all duration-300 shadow-sm hover:shadow-md cursor-default"
                                    title={facility.Title}
                                >
                                    <div className="text-sky-600 group-hover/badge:text-sky-700 transition-colors">
                                        {getFacilityIcon(facility.Title)}
                                    </div>
                                    <span className="line-clamp-1 max-w-[100px]">{facility.Title}</span>

                                    {/* Shine effect on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover/badge:opacity-100 -translate-x-full group-hover/badge:translate-x-full transition-all duration-700 rounded-lg"></div>
                                </div>
                            ))}

                            {Facilities.length > 4 && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer">
                                    <HiSparkles className="w-3 h-3" />
                                    <span>+{Facilities.length - 4}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Premium Theme Badges */}
                {topThemes.length > 0 && (
                    <div className="mb-3 hidden sm:block">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Thèmes
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {topThemes.map((theme, index) => {
                                const style = getThemeStyle(theme);
                                return (
                                    <div
                                        key={index}
                                        className={`group/theme relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br ${style.bg} border-2 ${style.border} rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all duration-300 cursor-default overflow-hidden`}
                                    >
                                        <div className={`text-transparent bg-gradient-to-r ${style.gradient} bg-clip-text`}>
                                            {style.icon}
                                        </div>
                                        <span className={`text-transparent bg-gradient-to-r ${style.gradient} bg-clip-text`}>
                      {theme}
                    </span>

                                        {/* Animated background on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover/theme:opacity-10 transition-opacity duration-300`}></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1 min-h-[8px]" />

                {/* Contact Actions */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {Phone && (
                        <a
                            href={`tel:${Phone}`}
                            className="group/contact flex items-center justify-center gap-1.5 bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 hover:border-sky-300 rounded-lg px-3 py-2 hover:shadow-md transition-all duration-300"
                        >
                            <MdPhone className="text-sky-600 w-4 h-4 group-hover/contact:scale-110 transition-transform" />
                            <span className="text-sm text-sky-800 font-bold">Appeler</span>
                        </a>
                    )}

                    {Email && (
                        <a
                            href={`mailto:${Email}`}
                            className="group/contact flex items-center justify-center gap-1.5 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2 hover:shadow-md transition-all duration-300"
                            title={Email}
                        >
                            <MdEmail className="text-gray-600 w-4 h-4 group-hover/contact:scale-110 transition-transform" />
                            <span className="text-sm text-gray-800 font-bold">Email</span>
                        </a>
                    )}
                </div>

                {/* Premium CTA Button */}
                <Link
                    to={`/hotels/${Id}`}
                    className="group/btn relative w-full inline-flex justify-center items-center gap-2 font-bold text-white
                     rounded-xl overflow-hidden transition-all duration-300 py-3 px-4 text-sm shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-300/50"
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-sky-700 to-indigo-600 transition-all duration-300"></div>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>

                    {/* Button Content */}
                    <AiOutlineEye className="w-5 h-5 relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10 tracking-wide">Voir les détails</span>
                </Link>
            </div>
        </article>
    );
}

export default HotelCard;
