// src/pages/HotelDetails.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    MapPin, Star, Wifi, Coffee, Waves, Car, Dumbbell, Utensils,
    ChevronLeft, X, Tag, Users, Eye, Building2, Info, Wind,
    Sparkles, UtensilsCrossed, Shield, Clock, Award, Navigation,
    Mountain, Home, Receipt, CheckCircle2, Calendar, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";
import DateRangePicker from "../components/booking/DateRangePicker.jsx";

// ── Module-level constants ────────────────────────────────────────────────────

const getDefaultCheckIn = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getDefaultCheckOut = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);
    return d;
};

// ✅ Convert Date object → "YYYY-MM-DD" string for API calls
const toDateString = (date) =>
    date instanceof Date ? date.toISOString().split("T")[0] : null;

// ✅ Convert "YYYY-MM-DD" string → Date object for DateRangePicker
const toDateObject = (str) => {
    if (!str) return null;
    const d = new Date(str);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
};

const commonAmenities = [
    { icon: Wifi,            label: "WiFi Gratuit" },
    { icon: Waves,           label: "Piscine" },
    { icon: Car,             label: "Parking Gratuit" },
    { icon: Dumbbell,        label: "Salle de Sport" },
    { icon: UtensilsCrossed, label: "Restaurant" },
    { icon: Utensils,        label: "Service en Chambre" },
    { icon: Wind,            label: "Climatisation" },
    { icon: Sparkles,        label: "Spa & Wellness" },
    { icon: Coffee,          label: "Bar & Lounge" },
    { icon: Shield,          label: "Sécurité 24/7" },
];

const tabs = [
    { id: "overview",  label: "Aperçu",      icon: Info },
    { id: "location",  label: "Localisation", icon: MapPin },
    { id: "gallery",   label: "Galerie",      icon: Eye },
    { id: "amenities", label: "Équipements",  icon: Building2 },
];

const BOOKING_ADVANTAGES = [
    { icon: Award,    title: "Meilleur Prix Garanti", desc: "Nous garantissons le meilleur tarif du marché" },
    { icon: Clock,    title: "Annulation Flexible",   desc: "Modifiez ou annulez facilement" },
    { icon: Sparkles, title: "Privilèges Exclusifs",  desc: "Surclassement et services premium" },
    { icon: Shield,   title: "Support 24/7",          desc: "Assistance disponible à tout moment" },
];

const EXTRA_SERVICES = [
    "Conciergerie disponible 24h/24",
    "Service de blanchisserie",
    "Transfert aéroport (sur demande)",
    "Organisation d'excursions",
];

// ✅ childAges in DEFAULT_ROOM
const DEFAULT_ROOM = { adults: 2, children: 0, childAges: [], selectedRoomType: "" };

// ✅ Normalize Album items that may be raw strings
const normalizeImage = (img) =>
    typeof img === "string" ? { Url: img, Alt: "" } : img;

// ✅ childAges parsed and carried forward
function parseRoomsParam(searchParams) {
    const roomsParam = searchParams.get("rooms");
    if (!roomsParam) return [{ ...DEFAULT_ROOM }];
    try {
        return JSON.parse(decodeURIComponent(roomsParam)).map(r => ({
            adults:           r.adults    || 2,
            children:         r.children  || 0,
            childAges:        Array.isArray(r.childAges) ? r.childAges : [],
            selectedRoomType: "",
        }));
    } catch (e) {
        if (import.meta.env.DEV) console.error("Error parsing rooms:", e);
        return [{ ...DEFAULT_ROOM }];
    }
}

// ─────────────────────────────────────────────────────────────────────────────

function HotelDetails() {
    const params   = useParams();
    const hotelId  = params.hotelId || params.id;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const errorToastFiredRef = useRef(false);

    const [activeTab,          setActiveTab]          = useState("overview");
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [mainImageIndex,     setMainImageIndex]     = useState(0);

    // ✅ range holds Date objects — exactly what DateRangePicker expects
    const [range, setRange] = useState(() => {
        const fromStr = searchParams.get("checkin");
        const toStr   = searchParams.get("checkout");
        return {
            from: toDateObject(fromStr) ?? getDefaultCheckIn(),
            to:   toDateObject(toStr)   ?? getDefaultCheckOut(),
        };
    });

    const [rooms,            setRooms]            = useState(() => parseRoomsParam(searchParams));
    const [selectedBoarding, setSelectedBoarding] = useState("BB");
    const [availableRooms,   setAvailableRooms]   = useState([]);
    const [isSearchingRooms, setIsSearchingRooms] = useState(false);
    const [hasSearched,      setHasSearched]      = useState(false);

    // ✅ Derive string versions for API calls — single source of truth is range
    const checkInDate  = useMemo(() => toDateString(range.from), [range.from]);
    const checkOutDate = useMemo(() => toDateString(range.to),   [range.to]);

    // ✅ nights derived from Date objects directly
    const nights = useMemo(() => {
        if (!range.from || !range.to) return 1;
        const diff = range.to - range.from;
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }, [range.from, range.to]);

    // ✅ totalPrice × nights
    const totalPrice = useMemo(() =>
            rooms.reduce((total, room) => {
                if (!room.selectedRoomType) return total;
                const found = availableRooms.find(r => r.id === room.selectedRoomType);
                return found ? total + (found.price * nights) : total;
            }, 0),
        [rooms, availableRooms, nights]
    );

    // ✅ Single pass for guest summary
    const { totalAdults, totalChildren } = useMemo(() => ({
        totalAdults:   rooms.reduce((acc, r) => acc + r.adults,   0),
        totalChildren: rooms.reduce((acc, r) => acc + r.children, 0),
    }), [rooms]);

    // ── Data Fetching ─────────────────────────────────────────────────────────

    const { data: hotelData, isLoading, isError, error } = useQuery({
        queryKey: ["hotelDetail", hotelId],
        queryFn:  async () => {
            const response = await apiClient.getHotelDetail(Number(hotelId));
            if (response.errorMessage?.length > 0) {
                throw new Error(response.errorMessage.join(", "));
            }
            return response.hotelDetail;
        },
        enabled:   !!hotelId && !isNaN(Number(hotelId)),
        staleTime: 5 * 60 * 1000,
        retry:     2,
    });

    useEffect(() => {
        if (isError && !errorToastFiredRef.current) {
            errorToastFiredRef.current = true;
            toast.error(error?.message || "Échec du chargement des détails de l'hôtel");
        }
        if (!isError) errorToastFiredRef.current = false;
    }, [isError, error]);

    // ✅ allImages normalizes mixed string/object Album entries
    const allImages = useMemo(() => {
        if (!hotelData) return [];
        const base = hotelData.Image
            ? [{ Url: hotelData.Image, Alt: hotelData.Name }]
            : [];
        return [...base, ...(hotelData.Album || []).map(normalizeImage)];
    }, [hotelData]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const resetSearchState = useCallback(() => {
        setHasSearched(false);
        setAvailableRooms([]);
    }, []);

    // ✅ setRange passed directly to DateRangePicker — resets search on change
    const handleSetRange = useCallback((newRange) => {
        setRange(newRange);
        // Only reset if both dates change (i.e. a full new selection)
        if (newRange.from && newRange.to) {
            resetSearchState();
        }
    }, [resetSearchState]);

    // ✅ childAges included — uses derived string dates
    const handleSearchRooms = useCallback(async () => {
        if (!checkInDate || !checkOutDate) {
            toast.error("Veuillez sélectionner les dates de séjour");
            return;
        }
        if (range.from >= range.to) {
            toast.error("La date de départ doit être après la date d'arrivée");
            return;
        }

        setIsSearchingRooms(true);
        setHasSearched(false);

        try {
            const response = await apiClient.searchRoomAvailability({
                hotelId:      Number(hotelId),
                checkIn:      checkInDate,
                checkOut:     checkOutDate,
                boardingType: selectedBoarding,
                rooms: rooms.map(r => ({
                    adults:    r.adults,
                    children:  r.children,
                    childAges: Array.isArray(r.childAges) ? r.childAges : [],
                })),
            });

            if (response.errorMessage?.length > 0) {
                toast.error(response.errorMessage.join(", "));
                setAvailableRooms([]);
            } else {
                setAvailableRooms(response.rooms || []);
                setHasSearched(true);
                if (response.rooms?.length > 0) {
                    toast.success(`${response.rooms.length} option(s) de chambre disponible(s)!`);
                } else {
                    toast.error("Aucune chambre disponible pour ces critères");
                }
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Room search error:", err);
            toast.error("Erreur lors de la recherche de chambres");
            setAvailableRooms([]);
            setHasSearched(true);
        } finally {
            setIsSearchingRooms(false);
        }
    }, [checkInDate, checkOutDate, range, hotelId, rooms, selectedBoarding]);

    const handleReserve = useCallback(() => {
        if (!rooms.every(room => room.selectedRoomType)) {
            toast.error("Veuillez sélectionner un type de chambre pour chaque chambre");
            return;
        }
        if (totalPrice === 0) {
            toast.error("Veuillez rechercher les disponibilités d'abord");
            return;
        }

        const bookingData = {
            hotelId:      Number(hotelId),
            hotelName:    hotelData?.Name,
            checkIn:      checkInDate,
            checkOut:     checkOutDate,
            nights,
            boardingType: selectedBoarding,
            rooms: rooms.map(room => {
                const selectedRoom = availableRooms.find(r => r.id === room.selectedRoomType);
                return {
                    roomType:  selectedRoom?.name,
                    roomId:    selectedRoom?.id,
                    adults:    room.adults,
                    children:  room.children,
                    childAges: room.childAges ?? [],
                    price:     selectedRoom?.price,
                    total:     selectedRoom ? selectedRoom.price * nights : 0,
                };
            }),
            totalPrice,
            currency: "DZD",
        };

        navigate(`/booking/${hotelId}`, { state: { bookingData, hotel: hotelData } });
        toast.success("Redirection vers la réservation...");
    }, [rooms, totalPrice, hotelId, hotelData, checkInDate, checkOutDate, selectedBoarding, availableRooms, navigate, nights]);

    const addRoom = useCallback(() => {
        if (rooms.length >= 5) {
            toast.error("Maximum 5 chambres par réservation");
            return;
        }
        setRooms(prev => [...prev, { ...DEFAULT_ROOM }]);
        resetSearchState();
    }, [rooms.length, resetSearchState]);

    const removeRoom = useCallback((index) => {
        if (rooms.length <= 1) {
            toast.error("Au moins une chambre est requise");
            return;
        }
        setRooms(prev => prev.filter((_, i) => i !== index));
        resetSearchState();
    }, [rooms.length, resetSearchState]);

    const updateRoom = useCallback((index, field, value) => {
        setRooms(prev => prev.map((room, i) =>
            i === index ? { ...room, [field]: value } : room
        ));
    }, []);

    // ── Guards ────────────────────────────────────────────────────────────────

    if (!hotelId) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">URL Invalide</h2>
                    <p className="text-gray-600 mb-6">
                        Aucun identifiant d'hôtel trouvé dans l'URL. Veuillez sélectionner un hôtel depuis la liste.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        Retour à l'accueil
                    </button>
                </div>
            </section>
        );
    }

    if (isLoading) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
                        <div className="h-[500px] bg-gray-200 rounded-2xl mb-8" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl" />
                            <div className="h-96 bg-gray-200 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (isError || !hotelData) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                    <AlertCircle size={48} className="mx-auto text-orange-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Hôtel Non Trouvé</h2>
                    <p className="text-gray-600 mb-6">
                        {error?.message || "Impossible de charger les informations de l'hôtel"}
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        Retour
                    </button>
                </div>
            </section>
        );
    }

    const { Name, Category, City, Vues, Type, Tag: Tags, Boarding, Theme } = hotelData;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="min-h-screen w-full mx-auto bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">

            {/* Image Lightbox Modal */}
            {selectedImageIndex !== null && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImageIndex(null)}
                >
                    <button
                        onClick={() => setSelectedImageIndex(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={allImages[selectedImageIndex]?.Url}
                        alt={allImages[selectedImageIndex]?.Alt || Name}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => Math.max(0, prev - 1)); }}
                            disabled={selectedImageIndex === 0}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-50"
                        >
                            Précédent
                        </button>
                        <span className="px-4 py-2 bg-white/20 text-white rounded-lg">
                            {selectedImageIndex + 1} / {allImages.length}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => Math.min(allImages.length - 1, prev + 1)); }}
                            disabled={selectedImageIndex === allImages.length - 1}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-50"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold mb-6 transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Retour aux Hôtels
                </button>

                {/* Hero Section */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8 h-[350px] sm:h-[450px] lg:h-[550px]">
                    <img
                        src={allImages[mainImageIndex]?.Url || hotelData.Image}
                        alt={allImages[mainImageIndex]?.Alt || Name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    {Category?.Star && (
                                        <div className="flex items-center gap-1 bg-orange-500 px-4 py-2 rounded-full shadow-lg">
                                            {[...Array(Category.Star)].map((_, i) => (
                                                <Star key={i} size={18} fill="currentColor" className="text-white" />
                                            ))}
                                        </div>
                                    )}
                                    {Type && (
                                        <span className="bg-sky-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                            {Type}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-2xl">{Name}</h1>
                                <div className="flex items-center gap-2 text-base sm:text-lg">
                                    <MapPin size={22} className="flex-shrink-0" />
                                    <span className="font-medium">
                                        {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {allImages.length > 1 && (
                        <div className="absolute bottom-32 right-6 flex flex-col gap-2">
                            {allImages.slice(0, 6).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setMainImageIndex(index)}
                                    className={`rounded-full transition-all ${
                                        mainImageIndex === index
                                            ? "bg-white w-3 h-10"
                                            : "bg-white/60 hover:bg-white/80 w-3 h-3"
                                    }`}
                                    aria-label={`Voir image ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Category && (
                        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-orange-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Star className="text-orange-500" size={24} />
                                <span className="text-xs font-semibold text-gray-500 uppercase">Catégorie</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{Category.Title}</p>
                        </div>
                    )}
                    {Type && (
                        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-sky-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Home className="text-sky-600" size={24} />
                                <span className="text-xs font-semibold text-gray-500 uppercase">Type</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{Type}</p>
                        </div>
                    )}
                    {Vues?.length > 0 && (
                        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Mountain className="text-blue-600" size={24} />
                                <span className="text-xs font-semibold text-gray-500 uppercase">Vues</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{Vues[0]}</p>
                        </div>
                    )}
                    {City && (
                        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Navigation className="text-green-600" size={24} />
                                <span className="text-xs font-semibold text-gray-500 uppercase">Ville</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{City.Name}</p>
                        </div>
                    )}
                </div>

                {/* Tags and Themes */}
                {(Theme?.length > 0 || Tags?.length > 0) && (
                    <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                            <Tag className="text-orange-500" size={22} />
                            Thèmes & Caractéristiques
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {Theme?.map((theme) => (
                                <span
                                    key={theme}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100
                                    rounded-full shadow-md border-2 border-orange-200 text-orange-700 font-semibold hover:shadow-lg transition-all hover:scale-105"
                                >
                                    <Sparkles size={16} />
                                    {theme}
                                </span>
                            ))}
                            {Tags?.map((tag) => (
                                <span
                                    key={tag.Id}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-50 to-sky-100 rounded-full shadow-md border-2 border-sky-200 text-sky-700 font-semibold hover:shadow-lg transition-all hover:scale-105"
                                >
                                    <Users size={16} />
                                    {tag.Title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-sky-600 text-white shadow-xl shadow-sky-600/30 scale-105"
                                        : "bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg"
                                }`}
                            >
                                <Icon size={22} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 lg:pb-8">

                    {/* ── Left Content ─────────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Overview */}
                        {activeTab === "overview" && (
                            <>
                                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <Info className="text-sky-600" size={32} />
                                        À Propos de {Name}
                                    </h2>
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 leading-relaxed text-lg mb-6">
                                            Découvrez {Name}, un {Type?.toLowerCase()} exceptionnel situé à {City?.Name},{" "}
                                            {City?.Country?.Name ?? ""}.
                                            Classé {Category?.Title}, cet établissement offre une expérience unique avec{" "}
                                            {Vues?.length > 0 ? `une magnifique ${Vues[0].toLowerCase()}` : "des vues imprenantes"}.
                                        </p>
                                        {Theme?.length > 0 && (
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                Parfait pour{" "}
                                                {Theme.map((t, i) => (
                                                    <span key={t}>
                                                        {i > 0 && (i === Theme.length - 1 ? " et " : ", ")}
                                                        <strong className="text-sky-700">{t.toLowerCase()}</strong>
                                                    </span>
                                                ))}
                                                , cet hôtel répond à tous vos besoins de confort et de détente.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {Boarding?.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                        <h3 className="font-bold text-gray-800 mb-6 text-2xl flex items-center gap-3">
                                            <Receipt className="text-orange-500" size={28} />
                                            Formules de Pension
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            {Boarding.map((board) => (
                                                <div
                                                    key={board.Id}
                                                    className="p-6 bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full">
                                                            {board.Code}
                                                        </span>
                                                        <CheckCircle2 className="text-green-600" size={22} />
                                                    </div>
                                                    <p className="font-bold text-gray-800 text-xl mb-2">{board.Name}</p>
                                                    {board.Description && (
                                                        <p className="text-sm text-gray-600 leading-relaxed">{board.Description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 bg-sky-50 rounded-xl border-l-4 border-sky-600">
                                            <p className="text-sm text-gray-700">
                                                <strong>💡 Conseil :</strong> Les formules de pension peuvent varier selon la saison.
                                                Contactez-nous pour plus d'informations sur les tarifs actuels.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl shadow-xl p-6 md:p-8 text-white">
                                    <h3 className="font-bold mb-6 text-2xl flex items-center gap-3">
                                        <Award size={28} />
                                        Avantages de la Réservation Directe
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {BOOKING_ADVANTAGES.map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                                <Icon className="flex-shrink-0 mt-1" size={24} />
                                                <div>
                                                    <h4 className="font-bold mb-1">{title}</h4>
                                                    <p className="text-sm text-sky-100">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Location */}
                        {activeTab === "location" && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                                    <Navigation className="text-sky-600" size={32} />
                                    Localisation & Accès
                                </h2>
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200">
                                        <div className="flex items-start gap-4">
                                            <MapPin className="text-sky-600 flex-shrink-0" size={32} />
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-xl mb-2">Adresse</h3>
                                                <p className="text-gray-700 text-lg leading-relaxed">
                                                    {Name}<br />
                                                    {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {Vues?.length > 0 && (
                                        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                                            <div className="flex items-start gap-4">
                                                <Eye className="text-orange-600 flex-shrink-0" size={32} />
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-xl mb-3">Points de Vue</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Vues.map((vue) => (
                                                            <span key={vue} className="px-4 py-2 bg-white rounded-full text-orange-700 font-semibold shadow-sm">
                                                                {vue}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <Car size={20} className="text-sky-600" /> Accès en Voiture
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                Parking gratuit disponible. GPS : {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                                            </p>
                                        </div>
                                        <div className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <Navigation size={20} className="text-sky-600" /> À Proximité
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                Centre-ville, plages, sites touristiques accessibles
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gallery */}
                        {activeTab === "gallery" && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                                    <Eye className="text-sky-600" size={32} />
                                    Galerie Photos ({allImages.length} photos)
                                </h2>
                                {allImages.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {allImages.map((img, index) => (
                                            <div
                                                key={img.Url ?? index}
                                                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all"
                                                onClick={() => setSelectedImageIndex(index)}
                                            >
                                                <img
                                                    src={img.Url}
                                                    alt={img.Alt || `${Name} - Image ${index + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                    <Eye size={40} className="text-white transform scale-75 group-hover:scale-100 transition-transform" />
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {index + 1}/{allImages.length}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <Eye size={64} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 text-lg">Aucune image disponible</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Amenities */}
                        {activeTab === "amenities" && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                                    <Building2 className="text-sky-600" size={32} />
                                    Équipements & Services Premium
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    {commonAmenities.map((amenity) => {
                                        const Icon = amenity.icon;
                                        return (
                                            <div
                                                key={amenity.label}
                                                className="flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border-2 border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all group"
                                            >
                                                <div className="p-3 bg-sky-600 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                                                    <Icon size={24} className="text-white" />
                                                </div>
                                                <span className="font-semibold text-gray-800">{amenity.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
                                    <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
                                        <Sparkles className="text-orange-500" size={24} />
                                        Services Additionnels
                                    </h3>
                                    <ul className="space-y-3">
                                        {EXTRA_SERVICES.map((service) => (
                                            <li key={service} className="flex items-center gap-3 text-gray-700">
                                                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                                                {service}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Sidebar: Booking Panel ─────────────────────── */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
                            <h3 className="font-bold text-gray-800 text-xl mb-6 flex items-center gap-2">
                                <Calendar className="text-sky-600" size={24} />
                                Réserver votre séjour
                            </h3>

                            {/* ✅ DateRangePicker — correct contract: range + setRange */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Dates du séjour
                                </label>
                                <DateRangePicker
                                    range={range}
                                    setRange={handleSetRange}
                                />
                            </div>

                            {/* Nights badge */}
                            {range.from && range.to && (
                                <div className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 rounded-lg px-3 py-2 mb-4 border border-sky-100">
                                    <Calendar size={16} />
                                    <span className="font-semibold">
                                        {nights} nuit{nights > 1 ? "s" : ""}
                                    </span>
                                    <span className="text-gray-400 text-xs ml-auto">
                                        {checkInDate} → {checkOutDate}
                                    </span>
                                </div>
                            )}

                            {/* Boarding Type */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Type de pension
                                </label>
                                <select
                                    value={selectedBoarding}
                                    onChange={(e) => {
                                        setSelectedBoarding(e.target.value);
                                        resetSearchState();
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors text-gray-800 bg-white"
                                >
                                    <option value="BB">Bed & Breakfast (BB)</option>
                                    <option value="HB">Demi-Pension (HB)</option>
                                    <option value="FB">Pension Complète (FB)</option>
                                    <option value="AI">Tout Inclus (AI)</option>
                                    <option value="RO">Chambre Seule (RO)</option>
                                </select>
                            </div>

                            {/* Rooms Config */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Chambres ({rooms.length})
                                    </label>
                                    <button
                                        onClick={addRoom}
                                        disabled={rooms.length >= 5}
                                        className="text-xs px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        + Ajouter
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {rooms.map((room, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-gray-700">
                                                    Chambre {index + 1}
                                                </span>
                                                {rooms.length > 1 && (
                                                    <button
                                                        onClick={() => removeRoom(index)}
                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Adultes</label>
                                                    <select
                                                        value={room.adults}
                                                        onChange={(e) => {
                                                            updateRoom(index, "adults", Number(e.target.value));
                                                            resetSearchState();
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-sky-400 focus:outline-none bg-white"
                                                    >
                                                        {[1, 2, 3, 4].map(n => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Enfants</label>
                                                    <select
                                                        value={room.children}
                                                        onChange={(e) => {
                                                            updateRoom(index, "children", Number(e.target.value));
                                                            resetSearchState();
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-sky-400 focus:outline-none bg-white"
                                                    >
                                                        {[0, 1, 2, 3].map(n => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Guests summary */}
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                    <Users size={14} />
                                    <span>
                                        {totalAdults} adulte{totalAdults > 1 ? "s" : ""}
                                        {totalChildren > 0 && `, ${totalChildren} enfant${totalChildren > 1 ? "s" : ""}`}
                                    </span>
                                </div>
                            </div>

                            {/* Search Button */}
                            <button
                                onClick={handleSearchRooms}
                                disabled={isSearchingRooms}
                                className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-4"
                            >
                                {isSearchingRooms ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Recherche en cours...
                                    </>
                                ) : (
                                    <>
                                        <Eye size={20} />
                                        Rechercher les disponibilités
                                    </>
                                )}
                            </button>

                            {/* Available Rooms */}
                            {hasSearched && (
                                <div className="space-y-3 mb-4">
                                    {availableRooms.length > 0 ? (
                                        <>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                                Sélectionnez vos chambres :
                                            </p>
                                            {rooms.map((room, roomIndex) => (
                                                <div key={roomIndex} className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                                                    <p className="text-xs font-bold text-sky-700 mb-2">
                                                        Chambre {roomIndex + 1}
                                                    </p>
                                                    <select
                                                        value={room.selectedRoomType}
                                                        onChange={(e) => updateRoom(roomIndex, "selectedRoomType", e.target.value)}
                                                        className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm focus:border-sky-500 focus:outline-none bg-white"
                                                    >
                                                        <option value="">-- Choisir un type --</option>
                                                        {availableRooms.map((r) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.name} — {new Intl.NumberFormat("fr-DZ").format(r.price * nights)} DZD
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                            <AlertCircle size={18} className="text-orange-500 flex-shrink-0" />
                                            <p className="text-sm text-orange-700 font-semibold">
                                                Aucune chambre disponible pour ces critères
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Total Price */}
                            {totalPrice > 0 && (
                                <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Total du séjour</span>
                                        <div className="text-right">
                                            <p className="text-2xl font-extrabold text-sky-700">
                                                {new Intl.NumberFormat("fr-DZ").format(totalPrice)}
                                                <span className="text-sm font-normal text-gray-500 ml-1">DZD</span>
                                            </p>
                                            {nights > 1 && (
                                                <p className="text-xs text-gray-400">
                                                    {nights} nuits · {rooms.length} chambre{rooms.length > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reserve Button */}
                            <button
                                onClick={handleReserve}
                                disabled={!hasSearched || availableRooms.length === 0 || totalPrice === 0}
                                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={20} />
                                Réserver maintenant
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HotelDetails;
