// src/pages/HotelDetails.jsx
import {useState, useMemo, useCallback, useEffect, useRef} from "react";
import {useQuery} from "@tanstack/react-query";
import {useParams, useNavigate, useSearchParams} from "react-router-dom";
import {
    MapPin, Star, ChevronLeft, X, Tag, Users, Eye, Sparkles,
    Navigation, Mountain, Home, CheckCircle2, Calendar, AlertCircle,
    LayoutGrid, Phone, Mail, Globe, Images, Info, Building2,
    Wifi, Car, Utensils, Waves, Wind, Coffee, Dumbbell,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";
import DateRangePicker from "../components/booking/DateRangePicker.jsx";

// ─── Module-level constants ────────────────────────────────────────────────────

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
const toDateString = (date) => (date instanceof Date ? date.toISOString().split("T")[0] : null);
const toDateObject = (str) => {
    if (!str) return null;
    const d = new Date(str);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
};

const BOARDING_LABELS = {
    RO: "Chambre Seule",
    BB: "Bed & Breakfast",
    HB: "Demi-Pension",
    FB: "Pension Complète",
    AI: "Tout Inclus",
    SC: "Self Catering",
};

const BOARDING_BADGE_STYLES = {
    RO: "bg-white/15 text-white border-white/25",
    BB: "bg-blue-400/30 text-blue-100 border-blue-300/40",
    HB: "bg-amber-300/30 text-amber-100 border-amber-200/40",
    FB: "bg-green-400/30 text-green-100 border-green-300/40",
    AI: "bg-purple-400/30 text-purple-100 border-purple-300/40",
    SC: "bg-yellow-300/30 text-yellow-100 border-yellow-200/40",
};

const BOARDING_TAB_STYLES = {
    ALL: {
        active: "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-200 border-transparent",
        inactive: "bg-white text-sky-700 border-sky-200 hover:bg-sky-50",
        dot: "bg-sky-400",
    },
    RO: {
        active: "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-200 border-transparent",
        inactive: "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
        dot: "bg-gray-400",
    },
    BB: {
        active: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 border-transparent",
        inactive: "bg-white text-blue-600 border-blue-200 hover:bg-blue-50",
        dot: "bg-blue-500",
    },
    HB: {
        active: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 border-transparent",
        inactive: "bg-white text-orange-600 border-orange-200 hover:bg-orange-50",
        dot: "bg-orange-500",
    },
    FB: {
        active: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200 border-transparent",
        inactive: "bg-white text-green-600 border-green-200 hover:bg-green-50",
        dot: "bg-green-500",
    },
    AI: {
        active: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200 border-transparent",
        inactive: "bg-white text-purple-600 border-purple-200 hover:bg-purple-50",
        dot: "bg-purple-500",
    },
    SC: {
        active: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-200 border-transparent",
        inactive: "bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50",
        dot: "bg-yellow-500",
    },
};

const DEFAULT_ROOM = {adults: 2, children: 0, childAges: [], selectedRoomType: null};

const normalizeImage = (img) =>
    typeof img === "string" ? {Url: img, Alt: img} : img;

function parseRoomsParam(searchParams) {
    const roomsParam = searchParams.get("rooms");
    if (!roomsParam) return [{...DEFAULT_ROOM}];
    try {
        return JSON.parse(decodeURIComponent(roomsParam)).map((r) => ({
            adults: r.adults ?? 2,
            children: r.children ?? 0,
            childAges: Array.isArray(r.childAges) ? r.childAges : [],
            selectedRoomType: null,
        }));
    } catch {
        return [{...DEFAULT_ROOM}];
    }
}

// ─── Facility icon mapper ──────────────────────────────────────────────────────

const getFacilityIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("wifi") || t.includes("internet")) return Wifi;
    if (t.includes("parking")) return Car;
    if (t.includes("restaurant") || t.includes("bar")) return Utensils;
    if (t.includes("piscine") || t.includes("plage")) return Waves;
    if (t.includes("climatisation")) return Wind;
    if (t.includes("café") || t.includes("petit")) return Coffee;
    if (t.includes("sport") || t.includes("gym")) return Dumbbell;
    if (t.includes("spa") || t.includes("bien")) return Sparkles;
    return Tag;
};

// ─── Component ────────────────────────────────────────────────────────────────

function HotelDetails() {
    const params = useParams();
    const hotelId = params.hotelId ?? params.id;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const errorToastFiredRef = useRef(false);
    const hasAutoSearched = useRef(false);

    // ── State ──────────────────────────────────────────────────────────────────
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [range, setRange] = useState({
        from: toDateObject(searchParams.get("checkin")) ?? getDefaultCheckIn(),
        to: toDateObject(searchParams.get("checkout")) ?? getDefaultCheckOut(),
    });
    const [rooms, setRooms] = useState(() => parseRoomsParam(searchParams));
    const [availableRooms, setAvailableRooms] = useState([]);
    const [isSearchingRooms, setIsSearchingRooms] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeBoardingTab, setActiveBoardingTab] = useState("ALL");

    // ── Derived ────────────────────────────────────────────────────────────────
    const checkInDate = useMemo(() => toDateString(range.from), [range.from]);
    const checkOutDate = useMemo(() => toDateString(range.to), [range.to]);

    const nights = useMemo(() => {
        if (!range.from || !range.to) return 1;
        return Math.max(1, Math.round((range.to - range.from) / 86400000));
    }, [range.from, range.to]);

    const boardingTabs = useMemo(() => {
        if (!availableRooms.length) return [];
        const seen = new Set();
        const result = [{code: "ALL", label: "Tous les types", count: availableRooms.length}];
        availableRooms.forEach((r) => {
            if (!seen.has(r.boardingCode)) {
                seen.add(r.boardingCode);
                result.push({
                    code: r.boardingCode,
                    label: BOARDING_LABELS[r.boardingCode] ?? r.boardingName,
                    count: availableRooms.filter((x) => x.boardingCode === r.boardingCode).length,
                });
            }
        });
        return result;
    }, [availableRooms]);

    const filteredRooms = useMemo(
        () => activeBoardingTab === "ALL"
            ? availableRooms
            : availableRooms.filter((r) => r.boardingCode === activeBoardingTab),
        [availableRooms, activeBoardingTab]
    );

    const totalPrice = useMemo(
        () => rooms.reduce((total, room) => {
            const found = filteredRooms.find((r) => r.id === room.selectedRoomType);
            return found ? total + found.price * nights : total;
        }, 0),
        [rooms, filteredRooms, nights]
    );

    const {totalAdults, totalChildren} = useMemo(() => ({
        totalAdults: rooms.reduce((acc, r) => acc + r.adults, 0),
        totalChildren: rooms.reduce((acc, r) => acc + r.children, 0),
    }), [rooms]);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const {data: hotelData, isLoading, isError, error} = useQuery({
        queryKey: ["hotelDetail", hotelId],
        queryFn: async () => {
            const response = await apiClient.getHotelDetail(Number(hotelId));
            if (response.errorMessage?.length > 0) throw new Error(response.errorMessage.join(", "));
            return response.hotelDetail;
        },
        enabled: !!hotelId && !isNaN(Number(hotelId)),
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    useEffect(() => {
        if (isError && !errorToastFiredRef.current) {
            errorToastFiredRef.current = true;
            toast.error(error?.message ?? "Échec du chargement des détails de l'hôtel");
        }
        if (!isError) errorToastFiredRef.current = false;
    }, [isError, error]);

    // ── Normalized images (existing pattern) ──────────────────────────────────
    const allImages = useMemo(() => {
        if (!hotelData) return [];
        const base = hotelData.Image ? [{Url: hotelData.Image, Alt: hotelData.Name}] : [];
        return [...base, ...(hotelData.Album ?? []).map(normalizeImage)];
    }, [hotelData]);

    // ── NEW: Derived hotel info fields ─────────────────────────────────────────
    const hotelDescription = hotelData?.Description ?? hotelData?.ShortDescription ?? "";
    const hotelAddress = hotelData?.Address ?? hotelData?.Adress ?? "";
    const facilities = Array.isArray(hotelData?.Facilities)
        ? hotelData.Facilities.slice(0, 12)
        : [];

    // ── Handlers ───────────────────────────────────────────────────────────────
    const resetSearchState = useCallback(() => {
        setHasSearched(false);
        setAvailableRooms([]);
        setActiveBoardingTab("ALL");
    }, []);

    const handleSetRange = useCallback((newRange) => {
        setRange(newRange);
        if (newRange.from && newRange.to) resetSearchState();
    }, [resetSearchState]);

    const handleBoardingTabChange = useCallback((code) => {
        setActiveBoardingTab(code);
        setRooms((prev) => prev.map((r) => ({...r, selectedRoomType: null})));
    }, []);

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
                hotelId: Number(hotelId),
                checkIn: checkInDate,
                checkOut: checkOutDate,
                rooms: rooms.map((r) => ({
                    adults: r.adults,
                    children: r.children,
                    childAges: Array.isArray(r.childAges) ? r.childAges : [],
                })),
            });
            const fetchedRooms = response.rooms ?? [];
            setAvailableRooms(fetchedRooms);
            setActiveBoardingTab("ALL");
            setHasSearched(true);
            if (fetchedRooms.length > 0) {
                toast.success(`${fetchedRooms.length} option${fetchedRooms.length > 1 ? "s" : ""} disponible${fetchedRooms.length > 1 ? "s" : ""} !`);
            } else {
                const msg = Array.isArray(response.errorMessage)
                    ? response.errorMessage.join(", ")
                    : (response.errorMessage ?? "Aucune chambre disponible pour ces critères");
                toast.error(msg);
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Room search error", err);
            toast.error(err?.message ?? "Erreur lors de la recherche de chambres");
            setAvailableRooms([]);
            setHasSearched(true);
        } finally {
            setIsSearchingRooms(false);
        }
    }, [checkInDate, checkOutDate, range, hotelId, rooms]);

    // Auto-search once hotel data is ready
    useEffect(() => {
        if (hotelData && !hasAutoSearched.current) {
            hasAutoSearched.current = true;
            handleSearchRooms();
        }
    }, [hotelData, handleSearchRooms]);

    const handleReserve = useCallback(() => {
        if (!rooms.every((r) => r.selectedRoomType)) {
            toast.error("Veuillez sélectionner un type de chambre pour chaque chambre");
            return;
        }
        if (totalPrice <= 0) {
            toast.error("Veuillez rechercher les disponibilités d'abord");
            return;
        }
        const bookingData = {
            hotelId: Number(hotelId),
            hotelName: hotelData?.Name,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            nights,
            boardingType: activeBoardingTab === "ALL"
                ? (filteredRooms.find((r) => r.id === rooms[0]?.selectedRoomType)?.boardingCode ?? "BB")
                : activeBoardingTab,
            rooms: rooms.map((room) => {
                const sel = filteredRooms.find((r) => r.id === room.selectedRoomType);
                return {
                    roomType: sel?.name,
                    roomId: sel?.id,
                    adults: room.adults,
                    children: room.children,
                    childAges: room.childAges ?? [],
                    price: sel?.price,
                    total: sel ? sel.price * nights : 0,
                };
            }),
            totalPrice,
            currency: "DZD",
        };
        navigate(`/booking/${hotelId}`, {state: {...bookingData, hotel: hotelData}});
        toast.success("Redirection vers la réservation...");
    }, [rooms, totalPrice, hotelId, hotelData, checkInDate, checkOutDate, activeBoardingTab, filteredRooms, navigate, nights]);

    const addRoom = useCallback(() => {
        if (rooms.length >= 5) {
            toast.error("Maximum 5 chambres par réservation");
            return;
        }
        setRooms((prev) => [...prev, {...DEFAULT_ROOM}]);
        resetSearchState();
    }, [rooms.length, resetSearchState]);

    const removeRoom = useCallback((index) => {
        if (rooms.length <= 1) {
            toast.error("Au moins une chambre est requise");
            return;
        }
        setRooms((prev) => prev.filter((_, i) => i !== index));
        resetSearchState();
    }, [rooms.length, resetSearchState]);

    const updateRoom = useCallback((index, field, value) => {
        setRooms((prev) => prev.map((room, i) => i === index ? {...room, [field]: value} : room));
    }, []);

    const handleChildrenChange = useCallback((roomIndex, newCount) => {
        setRooms((prev) => prev.map((room, i) => {
            if (i !== roomIndex) return room;
            const cur = Array.isArray(room.childAges) ? room.childAges : [];
            return {...room, children: newCount, childAges: Array.from({length: newCount}, (_, ci) => cur[ci] ?? 5)};
        }));
        resetSearchState();
    }, [resetSearchState]);

    const handleChildAgeChange = useCallback((roomIndex, childIndex, age) => {
        setRooms((prev) => prev.map((room, i) => {
            if (i !== roomIndex) return room;
            const newAges = [...(Array.isArray(room.childAges) ? room.childAges : [])];
            newAges[childIndex] = age;
            return {...room, childAges: newAges};
        }));
        resetSearchState();
    }, [resetSearchState]);

    // ── Guards ─────────────────────────────────────────────────────────────────
    if (!hotelId) return (
        <section
            className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">URL Invalide</h2>
                <p className="text-gray-600 mb-6">Aucun identifiant d'hôtel trouvé dans l'URL.</p>
                <button onClick={() => navigate("/")}
                        className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                    Retour à l'accueil
                </button>
            </div>
        </section>
    );

    if (isLoading) return (
        <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"/>
                    <div className="h-[500px] bg-gray-200 rounded-2xl mb-8"/>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"/>
                        <div className="h-96 bg-gray-200 rounded-2xl"/>
                    </div>
                </div>
            </div>
        </section>
    );

    if (isError || !hotelData) return (
        <section
            className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                <AlertCircle size={48} className="mx-auto text-orange-400 mb-4"/>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Hôtel Non Trouvé</h2>
                <p className="text-gray-600 mb-6">{error?.message || "Impossible de charger les informations de l'hôtel"}</p>
                <button onClick={() => navigate(-1)}
                        className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all shadow-lg">
                    Retour
                </button>
            </div>
        </section>
    );

    const {Name, Category, City, Vues, Type, Tag: Tags, Theme} = hotelData;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <section className="min-h-screen w-full mx-auto bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">

            {/* ── EXISTING: Lightbox ─────────────────────────────────────────────── */}
            {selectedImageIndex !== null && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                     onClick={() => setSelectedImageIndex(null)}>
                    <button onClick={() => setSelectedImageIndex(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
                        <X size={32}/>
                    </button>
                    <img
                        src={allImages[selectedImageIndex]?.Url}
                        alt={allImages[selectedImageIndex]?.Alt ?? Name}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex((p) => Math.max(0, p - 1));
                            }}
                            disabled={selectedImageIndex === 0}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-50">
                            Précédent
                        </button>
                        <span className="px-4 py-2 bg-white/20 text-white rounded-lg">
              {selectedImageIndex + 1} / {allImages.length}
            </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex((p) => Math.min(allImages.length - 1, p + 1));
                            }}
                            disabled={selectedImageIndex === allImages.length - 1}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-50">
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">

                {/* ── EXISTING: Back button ─────────────────────────────────────────── */}
                <button onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sky-700 hover:text-sky-800 font-semibold mb-6 transition-colors group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                    Retour aux Hôtels
                </button>

                {/* ── EXISTING: Hero ────────────────────────────────────────────────── */}
                <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl mb-8 h-[350px] sm:h-[450px] lg:h-[550px]">
                    <img
                        src={allImages[mainImageIndex]?.Url ?? hotelData.Image}
                        alt={allImages[mainImageIndex]?.Alt ?? Name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    {Category?.Star && (
                                        <div
                                            className="flex items-center gap-1 bg-orange-500 px-4 py-2 rounded-full shadow-lg">
                                            {Array(Category.Star).fill(null).map((_, i) => (
                                                <Star key={i} size={18} fill="currentColor" className="text-white"/>
                                            ))}
                                        </div>
                                    )}
                                    {Type && (
                                        <span
                                            className="bg-sky-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">{Type}</span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-2xl">{Name}</h1>
                                <div className="flex items-center gap-2 text-base sm:text-lg">
                                    <MapPin size={22} className="flex-shrink-0"/>
                                    <span className="font-medium">
                    {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {allImages.length > 1 && (
                        <div className="absolute bottom-32 right-6 flex flex-col gap-2">
                            {allImages.slice(0, 6).map((_, i) => (
                                <button key={i} onClick={() => setMainImageIndex(i)}
                                        className={`rounded-full transition-all ${mainImageIndex === i ? "bg-white w-3 h-10" : "bg-white/60 hover:bg-white/80 w-3 h-3"}`}/>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── EXISTING: Quick Info Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Category && (
                        <div
                            className="bg-white rounded-xl p-4 shadow-lg border-2 border-orange-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Star className="text-orange-500" size={24}/>
                                <span className="text-xs font-semibold text-gray-500 uppercase">Catégorie</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{Category.Title}</p>
                        </div>
                    )}
                    {Type && (
                        <div
                            className="bg-white rounded-xl p-4 shadow-lg border-2 border-sky-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Home className="text-sky-600" size={24}/>
                                <span className="text-xs font-semibold text-gray-500 uppercase">Type</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{Type}</p>
                        </div>
                    )}
                    {Vues?.length > 0 && (
                        <div
                            className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Mountain className="text-blue-600" size={24}/>
                                <span className="text-xs font-semibold text-gray-500 uppercase">Vues</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{Vues[0]}</p>
                        </div>
                    )}
                    {City && (
                        <div
                            className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <Navigation className="text-green-600" size={24}/>
                                <span className="text-xs font-semibold text-gray-500 uppercase">Ville</span>
                            </div>
                            <p className="text-lg font-bold text-gray-800">{City.Name}</p>
                        </div>
                    )}
                </div>

                {/* ── EXISTING: Tags & Themes ───────────────────────────────────────── */}
                {(Theme?.length > 0 || Tags?.length > 0) && (
                    <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                            <Tag className="text-orange-500" size={22}/>
                            Thèmes & Caractéristiques
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {Theme?.map((theme) => (
                                <span key={theme}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-full shadow-md border-2 border-orange-200 text-orange-700 font-semibold hover:shadow-lg transition-all hover:scale-105">
                  <Sparkles size={16}/>
                                    {theme}
                </span>
                            ))}
                            {Tags?.map((tag) => (
                                <span key={tag.Id}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-50 to-sky-100 rounded-full shadow-md border-2 border-sky-200 text-sky-700 font-semibold hover:shadow-lg transition-all hover:scale-105">
                  <Users size={16}/>
                                    {tag.Title}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    NEW: HOTEL INFO SECTION
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-6 mb-10">

                    {/* 1 ── Gallery + Location side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Gallery (2/3) */}
                        {allImages.length > 0 && (
                            <div className="lg:col-span-2 space-y-2">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Images size={20} className="text-sky-500"/>
                                    Galerie Photos
                                    <span className="text-sm font-normal text-gray-400 ml-1">
                                        ({allImages.length} photos)
                                    </span>
                                </h2>

                                {/* Photo grid */}
                                <div
                                    className="grid grid-cols-4 grid-rows-2 gap-2 h-64 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-xl">
                                    {/* Main large photo */}
                                    <div
                                        className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
                                        onClick={() => setSelectedImageIndex(0)}
                                    >
                                        <img
                                            src={allImages[0]?.Url}
                                            alt={allImages[0]?.Alt ?? Name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div
                                            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"/>
                                        {/* Play icon hint */}
                                        <div
                                            className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                            <Images size={12}/>
                                            Photo principale
                                        </div>
                                    </div>

                                    {/* 4 thumbnails */}
                                    {allImages.slice(1, 5).map((img, i) => (
                                        <div
                                            key={i}
                                            className="relative cursor-pointer group overflow-hidden"
                                            onClick={() => setSelectedImageIndex(i + 1)}
                                        >
                                            <img
                                                src={img.Url}
                                                alt={img.Alt ?? `Photo ${i + 2}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div
                                                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"/>
                                            {/* "+N photos" overlay on last thumbnail */}
                                            {i === 3 && allImages.length > 5 && (
                                                <div
                                                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                                    <Images size={20}/>
                                                    <span className="text-xs font-bold mt-1">
                                                        +{allImages.length - 5} photos
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Fill empty slots when fewer than 4 side images */}
                                    {allImages.slice(1, 5).length < 4 &&
                                        Array.from({length: 4 - allImages.slice(1, 5).length}).map((_, i) => (
                                            <div key={`empty-${i}`} className="bg-gray-100"/>
                                        ))}
                                </div>

                                {/* View all link */}
                                {allImages.length > 1 && (
                                    <button
                                        onClick={() => setSelectedImageIndex(0)}
                                        className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                                    >
                                        <Images size={15}/>
                                        Voir toutes les photos ({allImages.length})
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Location & Contact card (1/3) */}
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <MapPin size={20} className="text-sky-500"/>
                                Localisation & Contact
                            </h2>

                            <div
                                className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                {/* Decorative top bar */}
                                <div className="h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400"/>

                                <div className="p-5 space-y-4 text-sm">
                                    {/* City / Country */}
                                    {City?.Name && (
                                        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                            <div className="p-2 bg-sky-50 rounded-lg flex-shrink-0">
                                                <MapPin size={16} className="text-sky-500"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                                                    Ville
                                                </p>
                                                <p className="font-bold text-gray-800 text-base">{City.Name}</p>
                                                {City?.Country?.Name && (
                                                    <p className="text-gray-500 text-xs mt-0.5">{City.Country.Name}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Address */}
                                    {hotelAddress && (
                                        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                            <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                                                <Building2 size={16} className="text-orange-500"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                                                    Adresse
                                                </p>
                                                <p className="text-gray-700 leading-snug">{hotelAddress}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Email */}
                                    {hotelData?.Email && (
                                        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                                            <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                                                <Mail size={16} className="text-purple-500"/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                                                    Email
                                                </p>
                                                <a href={`mailto:${hotelData.Email}`}
                                                   className="text-gray-700 hover:text-sky-600 transition-colors truncate block font-medium">
                                                    {hotelData.Email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Google Maps CTA */}
                                    {hotelData?.Localization && (
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(hotelData.Localization)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                                        >
                                            <Globe size={16}/>
                                            Voir sur Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2 ── Description */}
                    {hotelDescription && (
                        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-3">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Info size={18} className="text-sky-500"/>
                                À propos de l'hôtel
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                                {hotelDescription}
                            </p>
                        </div>
                    )}

                    {/* 3 ── Facilities */}
                    {facilities.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Sparkles size={18} className="text-sky-500"/>
                                Équipements & Services
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {facilities.map((f, i) => {
                                    const Icon = getFacilityIcon(f.Title ?? f.Name ?? "");
                                    return (
                                        <span
                                            key={f.Id ?? i}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs sm:text-sm font-semibold"
                                        >
              <Icon size={13}/>
                                            {f.Title ?? f.Name ?? f}
            </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                {/* ═══════════════════════════════════════════════════════════════════
                    END NEW SECTION
                    ═══════════════════════════════════════════════════════════════ */}

                {/* ── EXISTING: Main Grid (Availability + Booking Sidebar) ──────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 lg:pb-8">

                    {/* LEFT: Availability results */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Loading skeleton */}
                        {isSearchingRooms && (
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div
                                        className="w-11 h-11 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin flex-shrink-0"/>
                                    <div>
                                        <p className="font-bold text-gray-800 text-lg">Recherche en cours...</p>
                                        <p className="text-gray-400 text-sm">
                                            Vérification des disponibilités ·{" "}
                                            {rooms.length} chambre{rooms.length > 1 ? "s" : ""} ·{" "}
                                            {nights} nuit{nights > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="animate-pulse space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-28 bg-orange-50 rounded-xl"/>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {!isSearchingRooms && hasSearched && (
                            <div className="space-y-6">
                                {/* Results header banner */}
                                <div
                                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-700 via-sky-600 to-blue-700 shadow-2xl p-6 text-white">
                                    <div
                                        className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none"/>
                                    <div
                                        className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full pointer-events-none"/>
                                    <div
                                        className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div>
                                            <p className="text-sky-200 text-xs font-semibold uppercase tracking-widest mb-1">
                                                Résultats de disponibilité
                                            </p>
                                            <h2 className="text-2xl font-extrabold mb-4">
                                                {availableRooms.length > 0
                                                    ? `${availableRooms.length} option${availableRooms.length > 1 ? "s" : ""} trouvée${availableRooms.length > 1 ? "s" : ""}`
                                                    : "Aucune disponibilité"}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    {icon: Calendar, label: `${checkInDate} → ${checkOutDate}`},
                                                    {icon: null, label: `${nights} nuit${nights > 1 ? "s" : ""}`},
                                                    {
                                                        icon: null,
                                                        label: `${rooms.length} chambre${rooms.length > 1 ? "s" : ""}`
                                                    },
                                                    {
                                                        icon: Users,
                                                        label: `${totalAdults} adulte${totalAdults > 1 ? "s" : ""}${totalChildren > 0 ? ` · ${totalChildren} enfant${totalChildren > 1 ? "s" : ""}` : ""}`
                                                    },
                                                ].map(({icon: Icon, label}) => (
                                                    <span key={label}
                                                          className="flex items-center gap-1.5 text-xs font-medium bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                            {Icon && <Icon size={12}/>}
                                                        {label}
                          </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div
                                            className={`self-start flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border-2 backdrop-blur-sm flex-shrink-0 ${availableRooms.length > 0 ? "bg-green-400/20 border-green-300/50 text-green-200" : "bg-red-400/20 border-red-300/50 text-red-200"}`}>
                                            <span
                                                className={`w-2 h-2 rounded-full animate-pulse ${availableRooms.length > 0 ? "bg-green-400" : "bg-red-400"}`}/>
                                            {availableRooms.length > 0 ? "Disponible" : "Indisponible"}
                                        </div>
                                    </div>
                                </div>

                                {availableRooms.length > 0 ? (
                                    <>
                                        {/* Boarding Type Tabs */}
                                        <div className="bg-white rounded-2xl shadow-xl p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <LayoutGrid size={18} className="text-gray-500"/>
                                                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                                    Filtrer par formule de pension
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {boardingTabs.map((tab) => {
                                                    const style = BOARDING_TAB_STYLES[tab.code] ?? BOARDING_TAB_STYLES.ALL;
                                                    const isActive = activeBoardingTab === tab.code;
                                                    return (
                                                        <button key={tab.code}
                                                                onClick={() => handleBoardingTabChange(tab.code)}
                                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${isActive ? `${style.active} scale-105` : `${style.inactive} hover:scale-[1.02]`}`}>
                                                            <span
                                                                className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-white/80" : style.dot}`}/>
                                                            {tab.label}
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tab.count}
                              </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Room slots */}
                                        {rooms.map((room, roomIndex) => {
                                            const selectedOption = filteredRooms.find((r) => r.id === room.selectedRoomType);
                                            return (
                                                <div key={roomIndex}
                                                     className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                                                    {/* Slot header */}
                                                    <div
                                                        className={`flex items-center justify-between px-6 py-4 border-b ${selectedOption ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm flex-shrink-0 ${selectedOption ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                                                                {roomIndex + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">Chambre {roomIndex + 1}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {room.adults} adulte{room.adults > 1 ? "s" : ""}
                                                                    {room.children > 0 && ` · ${room.children} enfant${room.children > 1 ? "s" : ""}`}
                                                                    {room.childAges?.length > 0 && room.children > 0 && ` (${room.childAges.slice(0, room.children).map((a) => `${a} ans`).join(", ")})`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {selectedOption ? (
                                                            <div
                                                                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
                                                                <CheckCircle2 size={12}/>
                                                                <span
                                                                    className="truncate max-w-[130px]">{selectedOption.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className="text-xs text-gray-400 bg-white border border-dashed border-gray-300 px-4 py-2 rounded-full">
                                Aucune option sélectionnée
                              </span>
                                                        )}
                                                    </div>

                                                    {/* Options grid */}
                                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {filteredRooms.map((option) => {
                                                            const isSelected = room.selectedRoomType === option.id;
                                                            const badgeStyle = BOARDING_BADGE_STYLES[option.boardingCode] ?? BOARDING_BADGE_STYLES.RO;
                                                            return (
                                                                <div key={option.id}
                                                                     onClick={() => updateRoom(roomIndex, "selectedRoomType", option.id)}
                                                                     className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
                                                                         isSelected
                                                                             ? "shadow-2xl shadow-orange-300/50 scale-[1.02] ring-2 ring-white ring-offset-2 ring-offset-orange-400 opacity-100"
                                                                             : selectedOption
                                                                                 ? "shadow-sm scale-[0.97] opacity-50 saturate-50 hover:opacity-75 hover:saturate-75 hover:scale-[0.99] hover:shadow-md"
                                                                                 : "shadow-md hover:shadow-xl hover:scale-[1.015] opacity-100"
                                                                     }`}>
                                                                    <div
                                                                        className={`absolute inset-0 transition-all duration-300 ${isSelected ? "bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700" : "bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600"}`}/>
                                                                    <div
                                                                        className="absolute -top-5 -right-5 w-24 h-24 bg-white/10 rounded-full pointer-events-none"/>
                                                                    <div
                                                                        className="absolute -bottom-4 -left-4 w-16 h-16 bg-black/10 rounded-full pointer-events-none"/>
                                                                    <div className="relative p-5">
                                                                        {isSelected && (
                                                                            <div
                                                                                className="absolute top-4 right-4 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                                                <CheckCircle2 size={15}
                                                                                              className="text-orange-500"/>
                                                                            </div>
                                                                        )}
                                                                        <p className={`font-extrabold text-white text-sm leading-snug mb-3 drop-shadow-sm ${isSelected ? "pr-8" : "pr-2"}`}>
                                                                            {option.name}
                                                                        </p>
                                                                        <span
                                                                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border mb-4 backdrop-blur-sm ${badgeStyle}`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0"/>
                                                                            {BOARDING_LABELS[option.boardingCode] ?? option.boardingName}
                                    </span>
                                                                        <div
                                                                            className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                                                            <div
                                                                                className="flex items-end justify-between">
                                                                                <div>
                                                                                    <p className="text-[10px] text-orange-200 uppercase tracking-widest font-semibold mb-0.5">Par
                                                                                        nuit</p>
                                                                                    <p className="text-sm font-bold text-white/90">
                                                                                        {new Intl.NumberFormat("fr-DZ").format(option.price)}
                                                                                        <span
                                                                                            className="text-[11px] font-normal text-orange-200 ml-1">DZD</span>
                                                                                    </p>
                                                                                </div>
                                                                                <div
                                                                                    className="w-px h-8 bg-white/20 mx-2"/>
                                                                                <div className="text-right">
                                                                                    <p className="text-[10px] text-orange-200 uppercase tracking-widest font-semibold mb-0.5">
                                                                                        {nights} nuit{nights > 1 ? "s" : ""}
                                                                                    </p>
                                                                                    <p className="text-xl font-black text-white leading-tight drop-shadow">
                                                                                        {new Intl.NumberFormat("fr-DZ").format(option.price * nights)}
                                                                                        <span
                                                                                            className="text-[11px] font-normal text-orange-200 ml-1">DZD</span>
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Grand total banner */}
                                        {totalPrice > 0 && (
                                            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                                                <div
                                                    className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800"/>
                                                <div
                                                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400"/>
                                                <div
                                                    className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full pointer-events-none"/>
                                                <div
                                                    className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full pointer-events-none"/>
                                                <div
                                                    className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                                    <div>
                                                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">
                                                            Total estimé du séjour
                                                        </p>
                                                        <p className="text-4xl font-black text-white leading-none">
                                                            {new Intl.NumberFormat("fr-DZ").format(totalPrice)}
                                                            <span
                                                                className="text-xl font-semibold text-slate-400 ml-2">DZD</span>
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span
                                                                className="text-slate-400 text-xs">{nights} nuit{nights > 1 ? "s" : ""}</span>
                                                            <span className="text-slate-600">·</span>
                                                            <span
                                                                className="text-slate-400 text-xs">{rooms.length} chambre{rooms.length > 1 ? "s" : ""}</span>
                                                            <span className="text-slate-600">·</span>
                                                            <span className="text-orange-400 text-xs font-semibold">
                                {new Intl.NumberFormat("fr-DZ").format(Math.round(totalPrice / nights))} DZD/nuit
                              </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                                        {rooms.every((r) => r.selectedRoomType) ? (
                                                            <div
                                                                className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold px-4 py-2.5 rounded-full">
                                                                <CheckCircle2 size={13}/>
                                                                Toutes les chambres sélectionnées
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold px-4 py-2.5 rounded-full">
                                                                <AlertCircle size={13}/>
                                                                {rooms.filter((r) => !r.selectedRoomType).length} chambre{rooms.filter((r) => !r.selectedRoomType).length > 1 ? "s" : ""} sans
                                                                sélection
                                                            </div>
                                                        )}
                                                        <p className="text-slate-500 text-xs pl-1">
                                                            Sélectionnez une option par chambre pour réserver
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* No availability */
                                    <div
                                        className="relative overflow-hidden bg-white rounded-2xl shadow-xl p-12 text-center border border-orange-100">
                                        <div
                                            className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-white pointer-events-none rounded-2xl"/>
                                        <div className="relative">
                                            <div
                                                className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                                <AlertCircle size={36} className="text-orange-400"/>
                                            </div>
                                            <h3 className="text-xl font-extrabold text-gray-800 mb-2">Aucune chambre
                                                disponible</h3>
                                            <p className="text-gray-500 mb-7 max-w-sm mx-auto leading-relaxed">
                                                Aucune option n'est disponible pour les dates et critères sélectionnés.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Booking Sidebar (unchanged) ────────────────────────── */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
                            <h3 className="font-bold text-gray-800 text-xl mb-6 flex items-center gap-2">
                                <Calendar className="text-sky-600" size={24}/>
                                Réserver votre séjour
                            </h3>

                            {/* Dates */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Dates du
                                    séjour</label>
                                <DateRangePicker range={range} setRange={handleSetRange}/>
                            </div>

                            {range.from && range.to && (
                                <div
                                    className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 rounded-lg px-3 py-2 mb-4 border border-sky-100">
                                    <Calendar size={16}/>
                                    <span className="font-semibold">{nights} nuit{nights > 1 ? "s" : ""}</span>
                                    <span
                                        className="text-gray-400 text-xs ml-auto">{checkInDate} → {checkOutDate}</span>
                                </div>
                            )}

                            {/* Rooms */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Chambres ({rooms.length})
                                    </label>
                                    <button onClick={addRoom} disabled={rooms.length >= 5}
                                            className="text-xs px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors">
                                        + Ajouter
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {rooms.map((room, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <span
                                                    className="text-sm font-bold text-gray-700">Chambre {index + 1}</span>
                                                {rooms.length > 1 && (
                                                    <button onClick={() => removeRoom(index)}
                                                            className="text-red-400 hover:text-red-600 transition-colors">
                                                        <X size={16}/>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Adultes</label>
                                                    <select value={room.adults}
                                                            onChange={(e) => {
                                                                updateRoom(index, "adults", Number(e.target.value));
                                                                resetSearchState();
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-sky-400 focus:outline-none bg-white">
                                                        {[1, 2, 3, 4].map((n) => <option key={n}
                                                                                         value={n}>{n}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Enfants</label>
                                                    <select value={room.children}
                                                            onChange={(e) => handleChildrenChange(index, Number(e.target.value))}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-sky-400 focus:outline-none bg-white">
                                                        {[0, 1, 2, 3].map((n) => <option key={n}
                                                                                         value={n}>{n}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {room.children > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <label
                                                        className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                                        <Users size={12}/>
                                                        Âge des enfants
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Array.from({length: room.children}).map((_, ci) => (
                                                            <div key={ci}>
                                                                <label
                                                                    className="text-xs text-gray-400 mb-1 block">Enfant {ci + 1}</label>
                                                                <select
                                                                    value={room.childAges?.[ci] ?? 5}
                                                                    onChange={(e) => handleChildAgeChange(index, ci, Number(e.target.value))}
                                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-sky-400 focus:outline-none bg-white"
                                                                >
                                                                    {Array.from({length: 18}, (_, age) => (
                                                                        <option key={age} value={age}>
                                                                            {age === 0 ? "< 1 an" : `${age} an${age > 1 ? "s" : ""}`}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                    <Users size={14}/>
                                    <span>
                    {totalAdults} adulte{totalAdults > 1 ? "s" : ""}
                                        {totalChildren > 0 && `, ${totalChildren} enfant${totalChildren > 1 ? "s" : ""}`}
                  </span>
                                </div>
                            </div>

                            {/* Search button */}
                            <button onClick={handleSearchRooms} disabled={isSearchingRooms}
                                    className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-4">
                                {isSearchingRooms ? (
                                    <>
                                        <div
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                        Recherche en cours...
                                    </>
                                ) : (
                                    <>
                                        <Eye size={20}/>
                                        Rechercher les disponibilités
                                    </>
                                )}
                            </button>

                            {/* Total price */}
                            {totalPrice > 0 && (
                                <div
                                    className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Total du séjour</span>
                                        <div className="text-right">
                                            <p className="text-2xl font-extrabold text-orange-600">
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

                            {/* Reserve button */}
                            <button
                                onClick={handleReserve}
                                disabled={!hasSearched || availableRooms.length === 0 || totalPrice <= 0}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={20}/>
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
