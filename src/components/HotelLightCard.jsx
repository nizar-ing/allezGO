// src/components/HotelLightCard.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Heart, MapPin, Star, Wifi, Car, Utensils, Waves,
    Wind, Coffee, Dumbbell, Sparkles, ChevronRight,
    CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";

// ── Utilities ──────────────────────────────────────────────────────────────────

const formatPrice = (price) => {
    if (!price) return "0";
    return new Intl.NumberFormat("fr-DZ").format(price);
};

// ✅ DOMParser — decodes ALL HTML entities natively, textContent never executes scripts
const stripHtml = (html = "") => {
    if (!html) return "";
    try {
        const doc  = new DOMParser().parseFromString(html, "text/html");
        const text = doc.body.textContent || "";
        return text.replace(/\s+/g, " ").trim();
    } catch {
        return html
            .replace(/<[^>]*>/g, " ")
            .replace(/&[a-z]+;/gi, " ")
            .replace(/&#\d+;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
};

const getFacilityIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("wifi") || t.includes("internet")) return Wifi;
    if (t.includes("parking"))                          return Car;
    if (t.includes("restaurant") || t.includes("bar")) return Utensils;
    if (t.includes("piscine") || t.includes("plage"))  return Waves;
    if (t.includes("climatisation"))                    return Wind;
    if (t.includes("café") || t.includes("petit"))     return Coffee;
    if (t.includes("sport") || t.includes("gym"))      return Dumbbell;
    if (t.includes("spa") || t.includes("bien"))       return Sparkles;
    return CheckCircle2;
};

// ── Component ──────────────────────────────────────────────────────────────────

function HotelLightCard({
                            hotel,
                            onFavoriteToggle,
                            pricing           = null,
                            onBook            = null,
                            onViewDetail      = null,
                            showBookButton    = false,
                            nights            = 1,
                            searchParams      = null,
                            initialIsFavorite = false,
                        }) {
    const navigate = useNavigate();

    // ── Refs ───────────────────────────────────────────────────────────────────
    const cardRef        = useRef(null);
    // ✅ Fix #1 — ref tracks open state without entering fetchAvailability deps
    const showTarifsRef  = useRef(false);

    // ── UI state ───────────────────────────────────────────────────────────────
    const [isFavorite,  setIsFavorite]  = useState(initialIsFavorite);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showTarifs,  setShowTarifs]  = useState(false);
    const [isLoading,   setIsLoading]   = useState(false);

    // ── Dynamic API state ──────────────────────────────────────────────────────
    const [allRooms,          setAllRooms]          = useState([]);
    const [availableBoarding, setAvailableBoarding] = useState([]);
    const [selectedBoarding,  setSelectedBoarding]  = useState(null);
    const [noAvailability,    setNoAvailability]    = useState(false);
    const [hasFetched,        setHasFetched]        = useState(false);

    const {
        Id, Name, Category, City,
        ShortDescription, Description,
        Image, Album = [], Facilities = [],
    } = hotel;

    // ── Derived ────────────────────────────────────────────────────────────────
    const hotelImage = useMemo(() => {
        if (Album.length > 0) return Album[0];
        return Image || "https://loremflickr.com/600/400/hotel,luxury?lock=42";
    }, [Album, Image]);

    // ✅ Fix #2 — full decoded text, no JS truncation; line-clamp-3 handles overflow
    const shortDesc = useMemo(() => {
        const raw = ShortDescription || Description || "";
        return stripHtml(raw);
    }, [ShortDescription, Description]);

    const stars = useMemo(
        () => (Category?.Star ? Array(Math.min(Category.Star, 5)).fill(0) : []),
        [Category?.Star]
    );

    const topFacilities = useMemo(
        () => Facilities.slice(0, 4),
        [Facilities]
    );

    const filteredRooms = useMemo(() => {
        if (!selectedBoarding) return allRooms;
        return allRooms.filter(r => r.boardingCode === selectedBoarding);
    }, [allRooms, selectedBoarding]);

    // ✅ totalPrice = minPrice × nights
    const totalPrice = useMemo(() => {
        if (!pricing?.minPrice || !nights) return null;
        return pricing.minPrice * nights;
    }, [pricing?.minPrice, nights]);

    // ── Fetch availability ─────────────────────────────────────────────────────
    // ✅ Fix #1 — showTarifs removed from deps; ref used for toast guard instead
    const fetchAvailability = useCallback(async () => {
        if (!searchParams?.checkIn || !searchParams?.checkOut) return;

        setIsLoading(true);
        setNoAvailability(false);
        setAllRooms([]);
        setAvailableBoarding([]);
        setSelectedBoarding(null);

        try {
            const response = await apiClient.searchRoomAvailability({
                hotelId:  Id,
                checkIn:  searchParams.checkIn,
                checkOut: searchParams.checkOut,
                rooms: searchParams.rooms?.map(r => ({
                    adults:    r.adults ?? 2,
                    children:  Array.isArray(r.children) ? r.children.length : 0,
                    childAges: Array.isArray(r.children) ? r.children : [],
                })) ?? [{ adults: 2, children: 0, childAges: [] }],
            });

            if (!response.rooms?.length) {
                setNoAvailability(true);
                return;
            }

            const boardingMap = new Map();
            response.rooms.forEach(room => {
                if (!boardingMap.has(room.boardingCode)) {
                    boardingMap.set(room.boardingCode, {
                        code:  room.boardingCode,
                        label: room.boardingName,
                    });
                }
            });

            const dynamicBoarding = Array.from(boardingMap.values());
            setAllRooms(response.rooms);
            setAvailableBoarding(dynamicBoarding);
            setSelectedBoarding(dynamicBoarding[0]?.code ?? null);
            setHasFetched(true);

        } catch (err) {
            if (!err.isCancelled) {
                // ✅ Fix #1 — reads ref, not captured state value
                if (showTarifsRef.current) {
                    toast.error("Erreur lors de la recherche de disponibilités.");
                }
                setNoAvailability(true);
                setAvailableBoarding([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [Id, searchParams]); // ✅ showTarifs gone — stable across panel open/close

    // ── Option C — Viewport prefetch ───────────────────────────────────────────
    useEffect(() => {
        if (!searchParams?.checkIn || !searchParams?.checkOut) return;
        if (hasFetched) return;

        const el = cardRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    void fetchAvailability();
                    observer.unobserve(el);
                }
            },
            {
                threshold:  0.1,
                rootMargin: "200px",
            }
        );

        observer.observe(el);
        // ✅ Fix #6 — disconnect is universally safe even if el is unmounted
        return () => observer.disconnect();
    }, [searchParams, hasFetched, fetchAvailability]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleToggleTarifs = useCallback(() => {
        const next = !showTarifs;
        showTarifsRef.current = next;          // ✅ Fix #1 — keep ref in sync with state
        setShowTarifs(next);
        if (next && !hasFetched) void fetchAvailability();
    }, [showTarifs, hasFetched, fetchAvailability]);

    // ✅ Fix #3 — fetchAvailability is already self-resetting; no need for setHasFetched(false)
    const handleRefresh = useCallback(() => {
        void fetchAvailability();
    }, [fetchAvailability]);

    const handleFavoriteClick = useCallback((e) => {
        e.stopPropagation();
        const next = !isFavorite;
        setIsFavorite(next);
        onFavoriteToggle?.(Id, next);
        toast.success(next ? "Ajouté aux favoris" : "Retiré des favoris");
    }, [isFavorite, Id, onFavoriteToggle]);

    const handleBook = useCallback((room) => {
        if (onBook) {
            onBook(hotel, room);
        } else {
            navigate(
                `/hotels-search?hotelId=${Id}` +
                `&checkIn=${searchParams?.checkIn}` +
                `&checkOut=${searchParams?.checkOut}` +
                `&rooms=${encodeURIComponent(JSON.stringify(searchParams?.rooms ?? []))}`,
                { state: { hotel, selectedRoom: room, searchParams, nights } }
            );
        }
    }, [onBook, hotel, navigate, Id, searchParams, nights]);

    const handleViewDetail = useCallback(() => {
        if (onViewDetail) onViewDetail(Id);
        else navigate(`/hotels/${Id}`);
    }, [onViewDetail, navigate, Id]);

    // ──────────────────────────────────────────────────────────────────────────

    return (
        <div ref={cardRef} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">

            {/* ── Top section: image left + content right ─────────────────── */}
            <div className="flex flex-col sm:flex-row">

                {/* Image */}
                <div
                    className="relative sm:w-72 md:w-80 lg:w-96 h-64 sm:h-72 md:h-80 flex-shrink-0 cursor-pointer overflow-hidden"
                    onClick={handleViewDetail}
                >
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                    )}
                    <img
                        src={hotelImage}
                        alt={Name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500
                            ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.target.src = "https://loremflickr.com/600/400/hotel,luxury?lock=42";
                            setImageLoaded(true);
                        }}
                        loading="lazy"
                    />

                    {/* Stars badge */}
                    {stars.length > 0 && (
                        <div className="absolute top-3 left-3 flex items-center gap-0.5 bg-orange-500 px-2.5 py-1 rounded-full shadow">
                            {stars.map((_, i) => (
                                <Star key={i} size={12} fill="white" className="text-white" />
                            ))}
                        </div>
                    )}

                    {/* Favorite */}
                    <button
                        onClick={handleFavoriteClick}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow hover:scale-110 transition-transform"
                    >
                        <Heart
                            size={18}
                            className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}
                        />
                    </button>

                    {/* ✅ Image overlay — totalPrice + per-night hint */}
                    {pricing?.minPrice && (
                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                            <p className="text-xs text-gray-400 leading-none">À partir de</p>
                            <p className="text-sm font-bold text-sky-700 leading-tight">
                                {formatPrice(totalPrice ?? pricing.minPrice)}
                                <span className="text-xs font-normal text-gray-400 ml-1">DZD</span>
                            </p>
                            {nights > 1 && (
                                <p className="text-xs text-gray-400 leading-none mt-0.5">
                                    {formatPrice(pricing.minPrice)} / nuit
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-3">

                        {/* Name + City */}
                        <div>
                            <h3
                                className="font-bold text-gray-800 text-lg sm:text-xl leading-tight cursor-pointer hover:text-sky-700 transition-colors line-clamp-1 mb-1"
                                onClick={handleViewDetail}
                            >
                                {Name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                <MapPin size={14} className="text-sky-500 flex-shrink-0" />
                                <span className="truncate">
                                    {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                                </span>
                            </div>
                        </div>

                        {/* ✅ Fix #2 — full decoded text, line-clamp-3 handles visual overflow */}
                        {shortDesc && (
                            <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                                {shortDesc}
                            </p>
                        )}

                        {/* ✅ Fix #5 — stable key using f.Title */}
                        {topFacilities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {topFacilities.map((f, i) => {
                                    const Icon = getFacilityIcon(f.Title || "");
                                    return (
                                        <span
                                            key={f.Title ?? i}
                                            className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-xs border border-sky-100"
                                        >
                                            <Icon size={12} />
                                            {f.Title}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Nights + guests info row */}
                        {searchParams && (
                            <div className="flex items-center gap-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                                <span>🌙 {nights} nuit{nights > 1 ? "s" : ""}</span>
                                <span>•</span>
                                <span>
                                    👤 {searchParams.rooms?.reduce((s, r) => s + (r.adults || 0), 0)} adulte(s)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Bottom: price + buttons ────────────────────────── */}
                    <div className="flex items-end justify-between gap-3 flex-wrap mt-5 pt-4 border-t border-gray-100">

                        {/* Price block */}
                        <div className="flex flex-col justify-end">
                            {pricing?.minPrice ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 leading-none mb-0.5">
                                        À partir de
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-extrabold text-sky-700 leading-none">
                                            {formatPrice(totalPrice ?? pricing.minPrice)}
                                        </span>
                                        <span className="text-xs font-medium text-gray-400">DZD</span>
                                    </div>
                                    {nights > 1 ? (
                                        <span className="text-xs text-gray-400 mt-0.5">
                                            {nights} nuits · {formatPrice(pricing.minPrice)} DZD / nuit
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 mt-0.5">
                                            / nuit · par chambre
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 leading-none mb-0.5">Tarif</span>
                                    <span className="text-sm font-semibold text-gray-400 italic">Sur demande</span>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleViewDetail}
                                className="px-4 py-2 border border-sky-300 text-sky-700 hover:bg-sky-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
                            >
                                Détail <ChevronRight size={14} />
                            </button>
                            <button
                                onClick={handleToggleTarifs}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                Tarifs & Chambres
                                {showTarifs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tarifs panel ────────────────────────────────────────────────── */}
            {showTarifs && (
                <div className="border-t border-gray-100">

                    {/* Panel header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-700">
                            Choisissez votre formule
                        </p>
                        {hasFetched && !isLoading && (
                            <button
                                onClick={handleRefresh}
                                className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2"
                            >
                                Actualiser
                            </button>
                        )}
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex items-center justify-center gap-3 py-10">
                            <Loader2 size={28} className="animate-spin text-sky-500" />
                            <p className="text-sm text-gray-500">Recherche des disponibilités...</p>
                        </div>
                    )}

                    {/* No availability */}
                    {!isLoading && noAvailability && (
                        <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-center">
                            <AlertCircle size={28} className="text-orange-400" />
                            <p className="text-sm font-semibold text-orange-700">
                                Aucune disponibilité pour ces dates
                            </p>
                            <p className="text-xs text-gray-500">
                                Veuillez modifier vos dates ou consulter la fiche complète.
                            </p>
                            <button
                                onClick={handleViewDetail}
                                className="mt-2 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                Voir la fiche hôtel
                            </button>
                        </div>
                    )}

                    {/* Boarding tabs + rooms */}
                    {!isLoading && !noAvailability && availableBoarding.length > 0 && (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
                                {availableBoarding.map((board) => (
                                    <button
                                        key={board.code}
                                        onClick={() => setSelectedBoarding(board.code)}
                                        className={`
                                            flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold
                                            transition-all whitespace-nowrap border
                                            ${selectedBoarding === board.code
                                            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                            : "bg-white text-gray-600 border-gray-300 hover:border-sky-400 hover:text-sky-700"
                                        }
                                        `}
                                    >
                                        {board.label}
                                    </button>
                                ))}
                            </div>

                            {/* Room rows */}
                            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                                {filteredRooms.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-6">
                                        Aucune chambre disponible pour cette formule.
                                    </p>
                                ) : (
                                    filteredRooms.map((room) => {
                                        // ✅ Fix #4 — strict nights >= 1 guard
                                        const roomTotal = room.price != null && nights >= 1
                                            ? room.price * nights
                                            : room.price;
                                        return (
                                            <div
                                                key={room.id}
                                                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sky-50/60 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                        {room.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{room.boardingName}</p>
                                                </div>

                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-sky-700">
                                                            {formatPrice(roomTotal)}
                                                        </p>
                                                        {nights > 1 ? (
                                                            <p className="text-xs text-gray-400">
                                                                {room.currency} · {formatPrice(room.price)} / nuit
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400">
                                                                {room.currency} / nuit
                                                            </p>
                                                        )}
                                                    </div>

                                                    {showBookButton && (
                                                        <button
                                                            onClick={() => handleBook(room)}
                                                            className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                                        >
                                                            Réserver
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {filteredRooms.length} chambre{filteredRooms.length > 1 ? "s" : ""} disponible{filteredRooms.length > 1 ? "s" : ""}
                                </span>
                                <button
                                    onClick={handleViewDetail}
                                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                                >
                                    Fiche complète <ChevronRight size={12} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default HotelLightCard;
