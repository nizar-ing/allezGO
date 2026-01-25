import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router";
import { hotelOfferCards } from "../data/data";
import {
  FaStar,
  FaWifi,
  FaSwimmingPool,
  FaParking,
  FaUtensils,
  FaSpa,
  FaDumbbell,
  FaConciergeBell,
  FaMapMarkerAlt,
  FaBed,
  FaUsers,
  FaCalendarAlt,
  FaChild,
  FaCheck,
  FaArrowLeft,
  FaPhoneAlt,
  FaClock,
} from "react-icons/fa";
import { MdVerifiedUser } from "react-icons/md";
import Button from "../ui/Button.jsx";

function HotelDetails() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hotel = hotelOfferCards.find((hotel) => hotel.id === id);

  if (!hotel) {
    return <Navigate to="/not-found" replace />;
  }

  const galleryImages = [
    hotel.image,
    {
      src: "/images/hotels/hotel-blue-beach-golf-spa-monastir.webp",
      alt: "Hotel Lobby",
    },
    {
      src: "/images/hotels/hotel-dar-ismail-tabarka-sousse.webp",
      alt: "Restaurant",
    },
    {
      src: "/images/hotels/hotel-eden-club-skanes-enfants.webp",
      alt: "Spa Area",
    },
    {
      src: "/images/hotels/hotel-moevenpick-resort-marine-sousse.webp",
      alt: "Gym",
    },
  ];

  const amenities = [
    {
      icon: <FaWifi className="text-blue-500" />,
      name: "Wi-Fi Gratuit",
      featured: true,
    },
    {
      icon: <FaSwimmingPool className="text-blue-400" />,
      name: "Piscine",
      featured: true,
    },
    {
      icon: <FaParking className="text-gray-600" />,
      name: "Parking Gratuit",
      featured: true,
    },
    {
      icon: <FaUtensils className="text-yellow-500" />,
      name: "Restaurant",
      featured: true,
    },
    {
      icon: <FaSpa className="text-green-500" />,
      name: "Spa & Bien-être",
      featured: false,
    },
    {
      icon: <FaDumbbell className="text-red-500" />,
      name: "Salle de Sport",
      featured: false,
    },
    {
      icon: <FaConciergeBell className="text-purple-500" />,
      name: "Service en Chambre 24/7",
      featured: false,
    },
  ];

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <FaStar
          key={i}
          className={`${
            i < rating ? "text-yellow-400" : "text-gray-300"
          } inline-block transition-all duration-200 hover:scale-110`}
        />
      ));
  };

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <main className="max-w-6xl lg:max-w-4/5 mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-10 sm:pb-12">
        {/* Image Gallery */}
        <div className="mb-8 sm:mb-10">
          <div className="relative h-[260px] sm:h-[340px] md:h-[420px] lg:h-[500px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl overflow-hidden mb-4 sm:mb-6 shadow-2xl group">
            <img
              src={galleryImages[activeImage].src}
              alt={galleryImages[activeImage].alt}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>

            {/* Arrows */}
            <button
              onClick={() =>
                setActiveImage((prev) =>
                  prev === 0 ? galleryImages.length - 1 : prev - 1
                )
              }
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
            >
              <FaArrowLeft className="text-gray-800 text-sm sm:text-base" />
            </button>
            <button
              onClick={() =>
                setActiveImage((prev) =>
                  prev === galleryImages.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 rotate-180"
            >
              <FaArrowLeft className="text-gray-800 text-sm sm:text-base" />
            </button>

            {/* Counter */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-black/60 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              {activeImage + 1} / {galleryImages.length}
            </div>

            {/* Dots */}
            <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`transition-all duration-300 rounded-full ${
                    activeImage === index
                      ? "w-6 sm:w-8 h-2.5 sm:h-3 bg-white"
                      : "w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Voir l'image ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {galleryImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`relative h-16 sm:h-20 md:h-24 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                  activeImage === index
                    ? "ring-2 sm:ring-4 ring-blue-500 shadow-lg shadow-blue-500/50"
                    : "ring-1 sm:ring-2 ring-gray-200 hover:ring-blue-300"
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
                {activeImage === index && (
                  <div className="absolute inset-0 bg-blue-500/20" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel info */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                      {hotel.hotel.name}
                    </h1>
                    <MdVerifiedUser
                      className="text-blue-500 text-xl sm:text-2xl"
                      title="Vérifié"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex">
                      {renderStars(hotel.hotel.rating)}
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs sm:text-sm font-semibold border border-yellow-200">
                      {hotel.hotel.rating} ⭐
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                    <FaMapMarkerAlt className="text-red-500" />
                    <span className="font-medium">
                      {hotel.hotel.location.display}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none text-gray-600 leading-relaxed space-y-3 sm:space-y-4">
                <p className="text-sm sm:text-base md:text-lg">
                  Bienvenue au{" "}
                  <span className="font-semibold text-gray-900">
                    {hotel.hotel.name}
                  </span>
                  , un établissement {hotel.hotel.rating}-étoiles situé à{" "}
                  <span className="font-semibold text-gray-900">
                    {hotel.hotel.location.city}
                  </span>
                  . Notre hôtel allie confort moderne et élégance pour vous
                  offrir un séjour inoubliable.
                </p>
                <p className="text-sm sm:text-base">
                  Profitez d&apos;un cadre exceptionnel avec vue sur la
                  mer/ville, des chambres spacieuses et équipées, ainsi
                  qu&apos;un service attentionné pour rendre votre séjour des
                  plus agréables.
                </p>
                <p className="text-sm sm:text-base">
                  À proximité des principales attractions touristiques, notre
                  établissement est le point de départ idéal pour explorer les
                  merveilles de la région.
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                Équipements & Services
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {amenities
                  .slice(0, showAllAmenities ? amenities.length : 4)
                  .map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
                    >
                      <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200">
                        {amenity.icon}
                      </div>
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        {amenity.name}
                      </span>
                      {amenity.featured && (
                        <FaCheck className="ml-auto text-green-500 text-sm sm:text-base" />
                      )}
                    </div>
                  ))}
              </div>
              {amenities.length > 4 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 sm:mt-6 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 hover:gap-2.5 sm:hover:gap-3 transition-all duration-200"
                >
                  {showAllAmenities
                    ? "Voir moins"
                    : "Voir tous les équipements"}
                  <span
                    className={`transform transition-transform duration-200 ${
                      showAllAmenities ? "rotate-180" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                Avis des voyageurs
              </h2>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-5 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="text-center md:w-40">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 mb-1">
                    4.8
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(5)}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    247 avis
                  </p>
                </div>
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  {[
                    { label: "Excellent", percent: 85, color: "bg-green-500" },
                    { label: "Très bien", percent: 10, color: "bg-blue-500" },
                    { label: "Moyen", percent: 5, color: "bg-yellow-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-medium text-gray-600 w-16 sm:w-20">
                        {item.label}
                      </span>
                      <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-gray-700 w-8 sm:w-10 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {[1, 2].map((_, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                        {["J", "M"][index]}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                            {["Jean Dupont", "Marie Martin"][index]}
                          </h4>
                          <span className="text-[11px] sm:text-xs text-gray-500 flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            {["Il y a 2 semaines", "Il y a 1 mois"][index]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {renderStars(5 - index)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                      {
                        [
                          "Séjour exceptionnel ! L'hôtel est magnifique, le personnel est aux petits soins et la nourriture est délicieuse. Je recommande vivement !",
                          "Très bel hôtel avec une situation idéale. Les chambres sont spacieuses et propres. Petit bémol sur le bruit des couloirs.",
                        ][index]
                      }
                    </p>
                  </div>
                ))}
                <button className="w-full py-2.5 sm:py-3 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold hover:bg-blue-50 rounded-xl transition-all duration-200">
                  Voir tous les 247 avis →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            {/* Booking card */}
            <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-5 sm:p-7 md:p-8 border-2 border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 opacity-50" />

              <div className="relative">
                <div className="mb-5 sm:mb-8">
                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      {hotel.offer.price.formatted}
                    </span>
                    <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                      /nuit
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full w-fit border border-green-200">
                    <FaCheck className="text-sm sm:text-lg" />
                    <span className="text-xs sm:text-sm">
                      Meilleur prix garanti
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 sm:space-y-5 mb-5 sm:mb-8">
                  {[
                    {
                      icon: FaBed,
                      label: "Formule",
                      value: hotel.offer.boardTypeLabel,
                      color: "text-purple-500",
                    },
                    {
                      icon: FaUsers,
                      label: "Adultes",
                      value: "2 Adultes",
                      color: "text-blue-500",
                    },
                    {
                      icon: FaChild,
                      label: "Enfants",
                      value: hotel.offer.childPolicy.free
                        ? `1 Enfant - ${hotel.offer.childPolicy.maxAge} ans Gratuit`
                        : "Aucun",
                      color: "text-pink-500",
                    },
                    {
                      icon: FaCalendarAlt,
                      label: "Séjour",
                      value: "7 nuits, 8 jours",
                      color: "text-orange-500",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                      <div
                        className={`${item.color} text-lg sm:text-xl p-2 bg-gray-50 rounded-lg`}
                      >
                        <item.icon />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                          {item.label}
                        </p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <FaCheck className="text-blue-600 text-base sm:text-xl mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                        Annulation gratuite
                      </h4>
                      <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                        Annulez sans frais jusqu&apos;à 7 jours avant votre
                        arrivée
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full py-3.5 sm:py-4 text-sm sm:text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
                >
                  Réserver maintenant
                </Button>

                <p className="text-[10px] sm:text-xs text-center text-gray-500 mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
                  <MdVerifiedUser className="text-green-500" />
                  Aucun frais • Paiement sécurisé
                </p>
              </div>
            </div>

            {/* Help card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 border border-orange-200">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white p-2.5 sm:p-3 rounded-full shadow-md">
                  <FaPhoneAlt className="text-orange-500 text-lg sm:text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                    Besoin d&apos;aide ?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Notre équipe est disponible 24/7 pour répondre à vos
                    questions.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold text-xs sm:text-sm transition-all duration-200"
              >
                Contacter le support
              </Button>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

export default HotelDetails;
