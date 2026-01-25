import React from "react";
import {MdLocationOn} from "react-icons/md";
import {HiUsers} from "react-icons/hi";
import {BsCalendarCheck} from "react-icons/bs";
import Stars from "../ui/Stars.jsx";
import {AiOutlineEye} from "react-icons/ai";
import {Link} from "react-router-dom";

/**
 * HotelCard Component
 *
 * @param {object} hotelOffer - Hotel offer data object
 * @param {function} onViewOffer - Callback function when "View Offer" is clicked
 * @param {string} className - Additional CSS classes
 */
function HotelCard({hotelOffer={}, className = ""}) {
    if (!hotelOffer) return null;

    const {id,hotel, image, offer, cta, badges = []} = hotelOffer;

    // Badge color mapping
    const badgeColors = {
        family: "bg-pink-100 text-pink-700 border-pink-300",
        nature: "bg-green-100 text-green-700 border-green-300",
        kids: "bg-blue-100 text-blue-700 border-blue-300",
        city: "bg-gray-100 text-gray-700 border-gray-300",
        business: "bg-indigo-100 text-indigo-700 border-indigo-300",
        luxury: "bg-amber-100 text-amber-700 border-amber-300",
        sea: "bg-cyan-100 text-cyan-700 border-cyan-300",
        aqua: "bg-teal-100 text-teal-700 border-teal-300",
        pool: "bg-sky-100 text-sky-700 border-sky-300",
    };
    return (
        <section
            className={`group bg-white rounded-lg sm:rounded-xl transition-all duration-500 ease-out overflow-hidden border border-gray-50 hover:border-gray-300 hover:-translate-y-1 w-full ${className}`}
            style={{
                boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                    "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(107, 114, 128, 0.2), 0 0 30px -10px rgba(107, 114, 128, 0.4), 0 0 60px -20px rgba(107, 114, 128, 0.2)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)";
            }}
        >
            {/* Image Container */}
            <div className="relative h-48 sm:h-52 md:h-56 lg:h-64 overflow-hidden bg-gray-200">
                <img
                    src={image?.src}
                    alt={image?.alt || hotel?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div
                    className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                {/* Badges - Top Right */}
                {badges.length > 0 && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1.5 sm:gap-2 z-1">
                        {badges.map((badge, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border backdrop-blur-sm ${
                                    badgeColors[badge.type] ||
                                    "bg-white/90 text-gray-700 border-gray-300"
                                } shadow-lg`}
                            >
                {badge.label}
              </span>
                        ))}
                    </div>
                )}

                {/* Star Rating - Bottom Left on Image */}
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10">
                    <div
                        className="bg-white/95 backdrop-blur-sm rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-lg">
                        <Stars rating={hotel?.rating || 0} nbStars={5} size={14}/>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-5 lg:p-6">
                {/* Hotel Name */}
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors">
                    {hotel?.name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-600 mb-2 sm:mb-3">
                    <MdLocationOn className="text-sky-600 shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]"/>
                    <span className="text-xs sm:text-sm font-medium line-clamp-1">
            {hotel?.location?.display}
          </span>
                </div>

                {/* Board Type */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <BsCalendarCheck className="text-sky-600 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"/>
                    <span
                        className="text-xs sm:text-sm font-semibold text-gray-700 bg-sky-50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md">
            {offer?.boardTypeLabel || offer?.boardType}
          </span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-3 sm:my-4"/>

                {/* Price Section */}
                <div className="mb-3 sm:mb-4">
                    <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {offer?.price?.formatted ||
                  `${offer?.price?.amount} ${offer?.price?.currency}`}
            </span>
                        {offer?.price?.unit && (
                            <span className="text-xs sm:text-sm text-gray-500 font-medium">
                /{" "}
                                {offer?.price?.unit === "per night"
                                    ? "nuit"
                                    : offer?.price?.unit}
              </span>
                        )}
                    </div>
                    {offer?.price?.per && (
                        <p className="text-[10px] sm:text-xs text-gray-500">
                            Par{" "}
                            {offer?.price?.per === "person" ? "personne" : offer?.price?.per}
                        </p>
                    )}
                </div>

                {/* Child Policy */}
                {offer?.childPolicy && (
                    <div
                        className="flex items-start gap-2 mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-50 rounded-md sm:rounded-lg border border-green-200">
                        <HiUsers className="text-green-600 shrink-0 mt-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px]"/>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-green-800 leading-relaxed">
                                {offer.childPolicy.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* CTA Button */}
                <Link
                    to={`/hotels/${id}`}
                    className="w-full relative inline-flex justify-center items-center gap-1.5 sm:gap-2 font-semibold text-white rounded-lg cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-4 sm:py-3 sm:px-6 mt-3 sm:mt-4 text-sm sm:text-base"
                    style={{
                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        boxShadow:
                            "0 6px 20px rgba(249, 115, 22, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <AiOutlineEye className="w-4 h-4 sm:w-5 sm:h-5"/>
                    {cta?.label || "Voir l'offre"}
                </Link>
            </div>
        </section>
    );
}

export default HotelCard;
