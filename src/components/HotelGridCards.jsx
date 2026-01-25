import React from "react";
import { FaHotel, FaMapMarkerAlt } from "react-icons/fa";
import HotelCard from "./HotelCard.jsx";

/**
 * HotelGridCards Component
 *
 * Displays a grid of hotel cards with a beautiful section header
 *
 * @param {array} hotels - Array of hotel offer objects
 * @param {function} onViewOffer - Callback function when a hotel offer is clicked
 * @param {string} title - Section title (default: "Nos Hôtels")
 * @param {string} subtitle - Section subtitle/description
 * @param {boolean} showCount - Whether to show the count of hotels
 * @param {string} className - Additional CSS classes
 */
function HotelGridCards({
  hotels = [],
  onViewOffer,
  title = "Nos Hôtels les plus demandés",
  subtitle = "Découvrez notre sélection d'hôtels exceptionnels pour votre séjour de rêve",
  showCount = true,
  className = "",
}) {
  if (!hotels || hotels.length === 0) {
    return (
      <section
        className={`py-16 px-4 bg-linear-to-b from-gray-50 to-white w-full ${className}`}
      >
        <div className="w-full">
          <div className="text-center py-12">
            <FaHotel className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              Aucun hôtel disponible
            </h2>
            <p className="text-gray-500">
              Nous n'avons pas d'hôtels à afficher pour le moment.
            </p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      className={`py-8 px-6 bg-sky-50 w-full ${className}`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-linear-to-br from-sky-500 to-sky-700 rounded-xl shadow-lg">
              <FaHotel className="text-white" size={24} />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 font-bold text-sky-800 bg-clip-text">
              {title}
            </h2>
          </div>
          {showCount && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <FaMapMarkerAlt className="text-sky-500" size={14} />
              <span className="font-semibold">
                {hotels.length}{" "}
                {hotels.length === 1
                  ? "hôtel disponible"
                  : "hôtels disponibles"}
              </span>
            </div>
          )}
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {hotels.map((hotelOffer) => (
            <HotelCard
              key={hotelOffer.id}
              hotelOffer={hotelOffer}
              className="h-full"
            />
          ))}
        </div>

        {/* Optional: Load More / View All Button */}
        {hotels.length > 6 && (
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              Affichage de {Math.min(hotels.length, 6)} sur {hotels.length}{" "}
              hôtels
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default HotelGridCards;
