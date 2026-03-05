// src/pages/HotelDetails.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    MapPin, Star, ChevronLeft, ChevronDown, X, Tag, Users, Eye, Sparkles,
    Navigation, Mountain, Home, CheckCircle2, Calendar, AlertCircle,
    LayoutGrid, Images, Info, Building2,
    Wifi, Car, Utensils, Waves, Wind, Coffee, Dumbbell, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";
import DateRangePicker from "../components/booking/DateRangePicker.jsx";
import GuestRoomSelector from "../components/booking/GuestRoomSelector.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const getDefaultCheckIn = () => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); return d;
};
const getDefaultCheckOut = () => {
    const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(0, 0, 0, 0); return d;
};
const toDateString = (date) => (date instanceof Date ? date.toISOString().split("T")[0] : null);
const toDateObject = (str) => {
    if (!str) return null;
    const d = new Date(str); d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
};

const BOARDING_LABELS = {
    RO: "Chambre Seule", BB: "Bed & Breakfast", HB: "Demi-Pension",
    FB: "Pension Complète", AI: "Tout Inclus", SC: "Self Catering",
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

const makeDefaultRoom = () => ({ id: Date.now(), adults: 2, children: [] });

function parseRoomsParam(searchParams) {
    const roomsParam = searchParams.get("rooms");
    if (!roomsParam) return [makeDefaultRoom()];
    try {
        return JSON.parse(decodeURIComponent(roomsParam)).map((r, idx) => ({
            id: idx + 1,
            adults: r.adults ?? 2,
            children: Array.isArray(r.childAges)
                ? r.childAges.map((age, ci) => ({ id: ci + 1, age: age ?? 5 }))
                : Array.from({ length: r.children ?? 0 }, (_, ci) => ({ id: ci + 1, age: 5 })),
        }));
    } catch { return [makeDefaultRoom()]; }
}

const normalizeImage = (img) =>
    typeof img === "string" ? { Url: img, Alt: img } : img;

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
    const params         = useParams();
    const hotelId        = params.hotelId ?? params.id;
    const navigate       = useNavigate();
    const [searchParams] = useSearchParams();

    const errorToastFiredRef = useRef(false);
    const hasAutoSearched    = useRef(false);

    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [mainImageIndex,     setMainImageIndex]     = useState(0);
    const [range, setRange] = useState({
        from: toDateObject(searchParams.get("checkin"))  ?? getDefaultCheckIn(),
        to:   toDateObject(searchParams.get("checkout")) ?? getDefaultCheckOut(),
    });
    const [rooms,             setRooms]             = useState(() => parseRoomsParam(searchParams));
    const [availableRooms,    setAvailableRooms]    = useState([]);
    const [isSearchingRooms,  setIsSearchingRooms]  = useState(false);
    const [hasSearched,       setHasSearched]       = useState(false);
    const [activeBoardingTab, setActiveBoardingTab] = useState(null);
    const [roomsByPax,        setRoomsByPax]        = useState([]);
    const [selectedRoomTypes, setSelectedRoomTypes] = useState({});

    const checkInDate  = useMemo(() => toDateString(range.from), [range.from]);
    const checkOutDate = useMemo(() => toDateString(range.to),   [range.to]);
    const nights = useMemo(() => {
        if (!range.from || !range.to) return 1;
        return Math.max(1, Math.round((range.to - range.from) / 86400000));
    }, [range.from, range.to]);
    const { totalAdults, totalChildren } = useMemo(() => ({
        totalAdults:   rooms.reduce((acc, r) => acc + r.adults, 0),
        totalChildren: rooms.reduce((acc, r) => acc + r.children.length, 0),
    }), [rooms]);
    const boardingTabs = useMemo(() => {
        if (!availableRooms.length) return [];
        const seen = new Set(); const result = [];
        availableRooms.forEach((r) => {
            if (!seen.has(r.boardingCode)) {
                seen.add(r.boardingCode);
                result.push({ code: r.boardingCode, label: BOARDING_LABELS[r.boardingCode] ?? r.boardingName, count: availableRooms.filter((x) => x.boardingCode === r.boardingCode).length });
            }
        });
        return result;
    }, [availableRooms]);
    const filteredRooms = useMemo(
        () => !activeBoardingTab ? availableRooms : availableRooms.filter((r) => r.boardingCode === activeBoardingTab),
        [availableRooms, activeBoardingTab]
    );
    const effectiveRoomsByPax = useMemo(() => {
        if (roomsByPax.length > 0) return roomsByPax;
        if (rooms.length === 0 || availableRooms.length === 0) return [];
        return rooms.map((room, idx) => ({ paxIndex: idx, adults: room.adults, rooms: availableRooms }));
    }, [roomsByPax, availableRooms, rooms]);
    const computedTotalPrice = useMemo(() => {
        if (!effectiveRoomsByPax.length || !activeBoardingTab) return 0;
        let total = 0;
        for (let i = 0; i < effectiveRoomsByPax.length; i++) {
            const roomId = selectedRoomTypes[i];
            if (!roomId) return 0;
            const room = effectiveRoomsByPax[i]?.rooms.find((r) => r.id === roomId && r.boardingCode === activeBoardingTab);
            if (!room?.price) return 0;
            total += room.price * nights;
        }
        return total;
    }, [effectiveRoomsByPax, selectedRoomTypes, activeBoardingTab, nights]);
    const allSelected = useMemo(
        () => effectiveRoomsByPax.length > 0 && effectiveRoomsByPax.every((_, i) => !!selectedRoomTypes[i]),
        [effectiveRoomsByPax, selectedRoomTypes]
    );

    const { data: hotelData, isLoading, isError, error } = useQuery({
        queryKey: ["hotelDetail", hotelId],
        queryFn: async () => {
            const response = await apiClient.getHotelDetail(Number(hotelId));
            if (response.errorMessage?.length > 0) throw new Error(response.errorMessage.join(", "));
            return response.hotelDetail;
        },
        enabled: !!hotelId && !isNaN(Number(hotelId)),
        staleTime: 5 * 60 * 1000, retry: 2,
    });
    useEffect(() => {
        if (isError && !errorToastFiredRef.current) { errorToastFiredRef.current = true; toast.error(error?.message ?? "Échec du chargement des détails de l'hôtel"); }
        if (!isError) errorToastFiredRef.current = false;
    }, [isError, error]);

    const allImages = useMemo(() => {
        if (!hotelData) return [];
        const base = hotelData.Image ? [{ Url: hotelData.Image, Alt: hotelData.Name }] : [];
        return [...base, ...(hotelData.Album ?? []).map(normalizeImage)];
    }, [hotelData]);
    const hotelDescription = hotelData?.Description ?? hotelData?.ShortDescription ?? "";
    const hotelAddress     = hotelData?.Address ?? hotelData?.Adress ?? "";
    const facilities       = Array.isArray(hotelData?.Facilities) ? hotelData.Facilities.slice(0, 12) : [];

    const resetSearchState = useCallback(() => {
        setHasSearched(false); setAvailableRooms([]); setActiveBoardingTab(null); setRoomsByPax([]); setSelectedRoomTypes({});
    }, []);
    const handleSetRange = useCallback((newRange) => {
        setRange(newRange); if (newRange.from && newRange.to) resetSearchState();
    }, [resetSearchState]);
    const handleBoardingTabChange = useCallback((code) => { setActiveBoardingTab(code); setSelectedRoomTypes({}); }, []);
    const setRoomsWithReset = useCallback((updater) => { setRooms(updater); resetSearchState(); }, [resetSearchState]);
    const handleSearchRooms = useCallback(async () => {
        if (!checkInDate || !checkOutDate) { toast.error("Veuillez sélectionner les dates de séjour"); return; }
        if (range.from >= range.to) { toast.error("La date de départ doit être après la date d'arrivée"); return; }
        setIsSearchingRooms(true); setHasSearched(false); setSelectedRoomTypes({});
        try {
            const response = await apiClient.searchRoomAvailability({
                hotelId: Number(hotelId), checkIn: checkInDate, checkOut: checkOutDate,
                rooms: rooms.map((r) => ({ adults: r.adults, children: r.children.length, childAges: r.children.map((c) => c.age) })),
            });
            const fetchedRooms = response.rooms ?? [];
            setAvailableRooms(fetchedRooms);
            setRoomsByPax(response.roomsByPax ?? []);
            setActiveBoardingTab(fetchedRooms.length > 0 ? fetchedRooms[0].boardingCode : null);
            setHasSearched(true);
            if (fetchedRooms.length > 0) toast.success(`${fetchedRooms.length} option${fetchedRooms.length > 1 ? "s" : ""} disponible${fetchedRooms.length > 1 ? "s" : ""} !`);
            else toast.error(Array.isArray(response.errorMessage) ? response.errorMessage.join(", ") : (response.errorMessage ?? "Aucune chambre disponible pour ces critères"));
        } catch (err) {
            if (import.meta.env.DEV) console.error("Room search error", err);
            toast.error(err?.message ?? "Erreur lors de la recherche de chambres");
            setAvailableRooms([]); setHasSearched(true);
        } finally { setIsSearchingRooms(false); }
    }, [checkInDate, checkOutDate, range, hotelId, rooms]);
    useEffect(() => {
        if (hotelData && !hasAutoSearched.current) { hasAutoSearched.current = true; handleSearchRooms(); }
    }, [hotelData, handleSearchRooms]);
    const handleReserve = useCallback(() => {
        if (!allSelected) { toast.error("Veuillez sélectionner un type de chambre pour chaque chambre"); return; }
        if (computedTotalPrice <= 0) { toast.error("Veuillez rechercher les disponibilités d'abord"); return; }
        const selectedRoomsList = effectiveRoomsByPax.map((pax, i) => {
            const sel = filteredRooms.find((r) => r.id === selectedRoomTypes[i]);
            return { roomType: sel?.name, roomId: sel?.id, adults: pax.adults, children: rooms[i]?.children.length ?? 0, childAges: rooms[i]?.children.map((c) => c.age) ?? [], price: sel?.price, total: sel ? sel.price * nights : 0 };
        });
        const bookingData = { hotelId: Number(hotelId), hotelName: hotelData?.Name, checkIn: checkInDate, checkOut: checkOutDate, nights, boardingType: activeBoardingTab, rooms: selectedRoomsList, totalPrice: computedTotalPrice, currency: "DZD" };
        navigate(`/booking/${hotelId}`, { state: { ...bookingData, hotel: hotelData } });
        toast.success("Redirection vers la réservation...");
    }, [allSelected, computedTotalPrice, effectiveRoomsByPax, filteredRooms, selectedRoomTypes, rooms, hotelId, hotelData, checkInDate, checkOutDate, activeBoardingTab, navigate, nights]);

    // ── Guards ─────────────────────────────────────────────────────────────────
    if (!hotelId) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <h2 className="text-xl font-bold text-gray-700">URL Invalide</h2>
            <p className="text-gray-500 text-sm">Aucun identifiant d'hôtel trouvé dans l'URL.</p>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all shadow-md">Retour à l'accueil</button>
        </div>
    );
    if (isLoading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 border-[3px] border-sky-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Chargement de l'hôtel...</p>
            </div>
        </div>
    );
    if (isError || !hotelData) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <h2 className="text-xl font-bold text-gray-700">Hôtel Non Trouvé</h2>
            <p className="text-gray-500 text-sm">{error?.message || "Impossible de charger les informations de l'hôtel"}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all shadow-md">Retour</button>
        </div>
    );

    const { Name, Category, City, Vues, Type, Tag: Tags, Theme } = hotelData;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Lightbox ── */}
            {selectedImageIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setSelectedImageIndex(null)}>
                    <button onClick={() => setSelectedImageIndex(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/20">
                        <X size={18} />
                    </button>
                    <img src={allImages[selectedImageIndex]?.Url} alt={allImages[selectedImageIndex]?.Alt} className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <div className="flex items-center gap-3 mt-5">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((p) => Math.max(0, p - 1)); }} disabled={selectedImageIndex === 0} className="px-5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all">← Précédent</button>
                        <span className="text-white/60 text-sm bg-white/10 px-4 py-1.5 rounded-full">{selectedImageIndex + 1} / {allImages.length}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((p) => Math.min(allImages.length - 1, p + 1)); }} disabled={selectedImageIndex === allImages.length - 1} className="px-5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all">Suivant →</button>
                    </div>
                </div>
            )}

            <div className="w-[95%] mx-auto py-2">

                {/* ── Back button ── */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-5 transition-colors group">
                    <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    Retour aux Hôtels
                </button>

                {/* ── Hero ── */}
                <div className="relative h-[360px] sm:h-[480px] rounded-2xl overflow-hidden mb-6 shadow-lg">
                    <img
                        src={allImages[mainImageIndex]?.Url ?? "https://loremflickr.com/1200/500/hotel,luxury?lock=1"}
                        alt={allImages[mainImageIndex]?.Alt ?? Name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                    {/* ── Single unified bottom container ── */}
                    <div className="absolute bottom-6 left-6 right-14 flex flex-col gap-3">

                        {/* Row 1 — Badges */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {Category?.Star && (
                                <div className="flex items-center gap-1.5 bg-orange-500 px-4 py-2 rounded-full shadow-lg shadow-orange-900/40">
                                    {Array(Category.Star).fill(null).map((_, i) => (
                                        <Star key={i} size={15} className="fill-white text-white" />
                                    ))}
                                </div>
                            )}
                            {Type && (
                                <span className="text-sm font-bold px-4 py-2 bg-sky-500 text-white rounded-full shadow-lg shadow-sky-900/30 tracking-wide">
                    {Type}
                </span>
                            )}
                        </div>

                        {/* Row 2 — Hotel Name */}
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-xl leading-tight tracking-tight">
                            {Name}
                        </h1>

                        {/* Row 3 — City */}
                        <p className="flex items-center gap-2 text-white/80 text-base font-semibold">
                            <MapPin size={16} className="text-white/70 shrink-0" />
                            {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                        </p>
                    </div>

                    {/* Dot navigation */}
                    {allImages.length > 1 && (
                        <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 items-center">
                            {allImages.slice(0, 6).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMainImageIndex(i)}
                                    className={`rounded-full transition-all ${
                                        mainImageIndex === i
                                            ? "bg-white w-2.5 h-8"
                                            : "bg-white/50 hover:bg-white/80 w-2.5 h-2.5"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>


                {/* ── Quick Info Cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {Category && (
                        <div className="bg-white rounded-xl pl-4 pr-5 py-4 border border-gray-100 border-l-4 border-l-amber-400 shadow-sm flex flex-col gap-1.5">
                            <div className="flex items-center gap-2"><Star size={14} className="text-amber-400 shrink-0" /><span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Catégorie</span></div>
                            <span className="text-base font-bold text-gray-800">{Category.Title}</span>
                        </div>
                    )}
                    {Type && (
                        <div className="bg-white rounded-xl pl-4 pr-5 py-4 border border-gray-100 border-l-4 border-l-sky-400 shadow-sm flex flex-col gap-1.5">
                            <div className="flex items-center gap-2"><Home size={14} className="text-sky-500 shrink-0" /><span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Type</span></div>
                            <span className="text-base font-bold text-gray-800">{Type}</span>
                        </div>
                    )}
                    {Vues?.length > 0 && (
                        <div className="bg-white rounded-xl pl-4 pr-5 py-4 border border-gray-100 border-l-4 border-l-teal-400 shadow-sm flex flex-col gap-1.5">
                            <div className="flex items-center gap-2"><Mountain size={14} className="text-teal-500 shrink-0" /><span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Vues</span></div>
                            <span className="text-base font-bold text-gray-800">{Vues[0]}</span>
                        </div>
                    )}
                    {City && (
                        <div className="bg-white rounded-xl pl-4 pr-5 py-4 border border-gray-100 border-l-4 border-l-emerald-400 shadow-sm flex flex-col gap-1.5">
                            <div className="flex items-center gap-2"><Navigation size={14} className="text-emerald-500 shrink-0" /><span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Ville</span></div>
                            <span className="text-base font-bold text-gray-800">{City.Name}</span>
                        </div>
                    )}
                </div>

                {/* ── Tags & Themes ── */}
                {(Theme?.length > 0 || Tags?.length > 0) && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
                        <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Tag size={16} className="text-orange-400" /> Thèmes & Caractéristiques
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                            {Theme?.map((theme) => (
                                <span key={theme} className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-600 text-sm font-semibold px-4 py-2 rounded-full hover:bg-purple-100 transition-colors">
                                    <Sparkles size={12} className="text-purple-400 shrink-0" /> {theme}
                                </span>
                            ))}
                            {Tags?.map((tag) => (
                                <span key={tag.Title ?? tag} className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-600 text-sm font-semibold px-4 py-2 rounded-full hover:bg-sky-100 transition-colors">
                                    <Users size={12} className="text-sky-400 shrink-0" /> {tag.Title ?? tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    ── GALLERY + LOCATION — REDESIGNED
                ════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

                    {/* ── GALLERY ─────────────────────────────────────────── */}
                    {allImages.length > 0 && (
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                                        <Images size={15} className="text-sky-500" />
                                    </div>
                                    <span className="text-base font-bold text-gray-800">Galerie Photos</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                    {allImages.length} photo{allImages.length > 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Image grid — smart layout based on count */}
                            <div className="p-4">
                                {allImages.length === 1 ? (
                                    /* ── Single photo: full width, tall, with hover CTA ── */
                                    <div className="relative w-full h-72 rounded-xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(0)}>
                                        <img src={allImages[0].Url} alt={allImages[0].Alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-bold px-5 py-2.5 rounded-full shadow-xl">
                                                <Eye size={15} /> Voir en plein écran
                                            </div>
                                        </div>
                                    </div>
                                ) : allImages.length === 2 ? (
                                    /* ── Two photos: side by side ── */
                                    <div className="grid grid-cols-2 gap-2.5 h-72">
                                        {allImages.slice(0, 2).map((img, i) => (
                                            <div key={i} className="relative rounded-xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(i)}>
                                                <img src={img.Url} alt={img.Alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* ── 3+ photos: featured left + grid right ── */
                                    <div className="grid grid-cols-3 gap-2.5 h-72">
                                        {/* Featured main image */}
                                        <div className="col-span-2 relative rounded-xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(0)}>
                                            <img src={allImages[0].Url} alt={allImages[0].Alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                    <Eye size={12} /> Agrandir
                                                </span>
                                            </div>
                                        </div>
                                        {/* Right column thumbnails */}
                                        <div className="flex flex-col gap-2.5">
                                            {allImages.slice(1, 3).map((img, i) => (
                                                <div key={i} className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(i + 1)}>
                                                    <img src={img.Url} alt={img.Alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                                                    {/* "See all" overlay on last thumbnail when more photos exist */}
                                                    {i === 1 && allImages.length > 3 && (
                                                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                                                            <LayoutGrid size={18} className="text-white" />
                                                            <span className="text-white font-extrabold text-sm">+{allImages.length - 3}</span>
                                                            <span className="text-white/80 text-[10px] font-medium">photos</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer CTA — only when multiple images */}
                            {allImages.length > 1 && (
                                <div className="px-5 pb-4">
                                    <button
                                        onClick={() => setSelectedImageIndex(0)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all"
                                    >
                                        <Images size={14} />
                                        Voir toutes les photos ({allImages.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── LOCATION & CONTACT — no email ────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

                        {/* Colored map-pin header band */}
                        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-white leading-tight">Localisation</h2>
                                <p className="text-sky-200 text-xs font-medium">& Contact</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 p-5 gap-4">

                            {/* City block */}
                            {City?.Name && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Building2 size={14} className="text-sky-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Ville</p>
                                        <p className="text-base font-bold text-gray-800 leading-tight">{City.Name}</p>
                                        {City?.Country?.Name && (
                                            <p className="text-sm text-gray-400 mt-0.5">{City.Country.Name}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            {(City?.Name && hotelAddress) && <div className="border-t border-gray-100" />}

                            {/* Address block */}
                            {hotelAddress && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Navigation size={14} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Adresse</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">{hotelAddress}</p>
                                    </div>
                                </div>
                            )}

                            {/* Spacer pushes CTA to bottom */}
                            <div className="flex-1" />

                            {/* Google Maps CTA — full width button */}
                            {hotelData?.Localization ? (
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(hotelData.Localization)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-200/50 transition-all active:scale-[0.98]"
                                >
                                    <MapPin size={15} />
                                    Voir sur Google Maps
                                    <ExternalLink size={13} className="opacity-70" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 w-full py-3 bg-gray-50 border border-gray-200 text-gray-400 text-sm font-medium rounded-xl justify-center">
                                    <MapPin size={15} />
                                    Localisation non disponible
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* ════════════════════════════════════════════════════════════ */}

                {/* ── Description ── */}
                {hotelDescription && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
                        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Info size={16} className="text-sky-500" /> À propos de l'hôtel
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed">{hotelDescription}</p>
                    </div>
                )}

                {/* ── Facilities ── */}
                {facilities.length > 0 && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
                        <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-sky-500" /> Équipements & Services
                        </h2>
                        <div className="flex flex-wrap gap-2.5">
                            {facilities.map((f, i) => {
                                const Icon = getFacilityIcon(f.Title ?? f.Name ?? "");
                                return (
                                    <span key={f.Title ?? i} className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-full hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50 transition-colors">
                                        <Icon size={13} className="shrink-0" /> {f.Title ?? f.Name ?? f}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Main Grid: Availability + Sidebar ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {isSearchingRooms && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-sky-100 animate-pulse" />
                                    <div><div className="h-4 w-44 bg-gray-100 rounded animate-pulse mb-2" /><div className="h-3 w-56 bg-gray-50 rounded animate-pulse" /></div>
                                </div>
                                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-xl mb-3 animate-pulse" />)}
                            </div>
                        )}

                        {!isSearchingRooms && hasSearched && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-extrabold text-white">Résultats de disponibilité</h2>
                                        <p className="text-sky-200 text-sm mt-0.5">{availableRooms.length > 0 ? `${availableRooms.length} option${availableRooms.length > 1 ? "s" : ""} trouvée${availableRooms.length > 1 ? "s" : ""}` : "Aucune disponibilité pour ces dates"}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-4 py-2 rounded-full ${availableRooms.length > 0 ? "bg-green-400/25 text-green-100 border border-green-300/40" : "bg-red-400/25 text-red-100 border border-red-300/40"}`}>
                                        {availableRooms.length > 0 ? "✓ Disponible" : "✗ Indisponible"}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {[`🗓 ${checkInDate} → ${checkOutDate}`, `🌙 ${nights} nuit${nights > 1 ? "s" : ""}`, `🛏 ${rooms.length} chambre${rooms.length > 1 ? "s" : ""}`, `👤 ${totalAdults} adulte${totalAdults > 1 ? "s" : ""}${totalChildren > 0 ? ` · ${totalChildren} enfant${totalChildren > 1 ? "s" : ""}` : ""}`].map((label, i) => (
                                            <span key={i} className="text-sm bg-gray-50 border border-gray-200 text-gray-600 px-4 py-2 rounded-full font-medium">{label}</span>
                                        ))}
                                    </div>
                                    {availableRooms.length > 0 ? (
                                        <>
                                            <div className="mb-5">
                                                <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-widest">Formule de pension</p>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {boardingTabs.map((tab) => {
                                                        const style = BOARDING_TAB_STYLES[tab.code] ?? BOARDING_TAB_STYLES.ALL;
                                                        const isActive = activeBoardingTab === tab.code;
                                                        return (
                                                            <button key={tab.code} onClick={() => handleBoardingTabChange(tab.code)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${isActive ? `${style.active} scale-[1.03]` : style.inactive}`}>
                                                                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />{tab.label}<span className="text-xs opacity-60 font-semibold">{tab.count}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3 mb-5">
                                                {effectiveRoomsByPax.map((pax, idx) => {
                                                    const paxRooms = pax.rooms.filter((r) => r.boardingCode === activeBoardingTab);
                                                    const selectedRoom = paxRooms.find((r) => r.id === selectedRoomTypes[idx]);
                                                    return (
                                                        <div key={idx} className="relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-sky-200 transition-colors">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-sky-600" />
                                                            <div className="p-4 pl-5">
                                                                <div className="flex items-center gap-2.5 mb-3">
                                                                    <span className="w-7 h-7 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-extrabold shrink-0">{idx + 1}</span>
                                                                    <span className="text-base font-bold text-gray-700">Chambre {idx + 1}<span className="mx-2 text-gray-300">—</span><span className="text-sky-600">{pax.adults} adulte{pax.adults > 1 ? "s" : ""}</span></span>
                                                                </div>
                                                                {paxRooms.length === 0 ? <p className="text-sm text-gray-400 italic">Aucune chambre disponible pour cette formule</p> : (
                                                                    <>
                                                                        <div className="relative">
                                                                            <select value={selectedRoomTypes[idx] ?? ""} onChange={(e) => setSelectedRoomTypes((prev) => ({ ...prev, [idx]: e.target.value }))} className="w-full appearance-none bg-white border-2 border-gray-200 focus:border-sky-400 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer font-medium transition-all">
                                                                                <option value="" disabled>— Sélectionnez le type de votre chambre —</option>
                                                                                {paxRooms.map((room) => <option key={room.id} value={room.id}>{room.name} — {new Intl.NumberFormat("fr-DZ").format(room.price * nights)} DZD</option>)}
                                                                            </select>
                                                                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                                        </div>
                                                                        {selectedRoom && (
                                                                            <div className="mt-2.5 flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5">
                                                                                <span className="text-sm text-sky-600 font-semibold">{BOARDING_LABELS[selectedRoom.boardingCode] ?? selectedRoom.boardingName}</span>
                                                                                <div className="flex items-baseline gap-1.5">
                                                                                    <span className="text-base font-extrabold text-sky-700">{new Intl.NumberFormat("fr-DZ").format(selectedRoom.price * nights)}</span>
                                                                                    <span className="text-sm text-sky-400 font-medium">DZD</span>
                                                                                    {nights > 1 && <span className="text-xs text-gray-400 ml-1">· {new Intl.NumberFormat("fr-DZ").format(selectedRoom.price)} / nuit</span>}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {computedTotalPrice > 0 && (
                                                <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-lg shadow-sky-200">
                                                    <div>
                                                        <p className="text-sm text-sky-200 font-medium mb-1">Total estimé · {nights} nuit{nights > 1 ? "s" : ""} · {rooms.length} chambre{rooms.length > 1 ? "s" : ""}</p>
                                                        <div className="flex items-baseline gap-2"><span className="text-3xl font-extrabold text-white">{new Intl.NumberFormat("fr-DZ").format(computedTotalPrice)}</span><span className="text-sky-200 font-bold text-base">DZD</span></div>
                                                    </div>
                                                    {allSelected
                                                        ? <span className="flex items-center gap-2 text-sm font-bold text-green-200 bg-green-400/20 border border-green-300/40 px-4 py-2 rounded-full"><CheckCircle2 size={14} /> Prêt à réserver</span>
                                                        : <span className="flex items-center gap-2 text-sm font-bold text-amber-200 bg-amber-400/20 border border-amber-300/40 px-4 py-2 rounded-full"><AlertCircle size={14} /> {effectiveRoomsByPax.filter((_, i) => !selectedRoomTypes[i]).length} chambre(s) restante(s)</span>
                                                    }
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-10">
                                            <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3"><AlertCircle size={24} className="text-amber-400" /></div>
                                            <h3 className="text-base font-bold text-gray-700 mb-1">Aucune chambre disponible</h3>
                                            <p className="text-sm text-gray-400 max-w-xs mx-auto">Aucune option disponible pour les dates et critères sélectionnés.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="flex flex-col gap-4 relative z-50">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24 z-50">
                            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
                                <Calendar size={16} className="text-sky-500 shrink-0" />
                                <h3 className="text-base font-bold text-gray-800">Réserver votre séjour</h3>
                            </div>
                            <div className="mb-5">
                                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2 block">Dates du séjour</label>
                                <DateRangePicker range={range} setRange={handleSetRange} />
                                {range.from && range.to && (
                                    <div className="flex items-center gap-2 mt-2.5">
                                        <span className="text-sm bg-sky-50 border border-sky-200 text-sky-600 font-semibold px-3 py-1.5 rounded-full">🌙 {nights} nuit{nights > 1 ? "s" : ""}</span>
                                        <span className="text-xs text-gray-400">{checkInDate} → {checkOutDate}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mb-5">
                                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2 block">Voyageurs & Chambres</label>
                                <GuestRoomSelector rooms={rooms} setRooms={setRoomsWithReset} />
                            </div>
                            <button onClick={handleSearchRooms} disabled={isSearchingRooms} className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-sky-200/60 mb-5 active:scale-[0.98]">
                                {isSearchingRooms ? (<><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Recherche en cours...</>) : (<><Calendar size={15} /> Rechercher les disponibilités</>)}
                            </button>
                            {computedTotalPrice > 0 && (
                                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4 text-center">
                                    <p className="text-xs text-sky-500 uppercase tracking-widest font-semibold mb-1">Total du séjour</p>
                                    <p className="text-2xl font-extrabold text-sky-700">{new Intl.NumberFormat("fr-DZ").format(computedTotalPrice)}<span className="text-sm font-semibold text-sky-400 ml-1.5">DZD</span></p>
                                    {nights > 1 && <p className="text-xs text-gray-400 mt-1">{nights} nuits · {rooms.length} chambre{rooms.length > 1 ? "s" : ""}</p>}
                                </div>
                            )}
                            <button onClick={handleReserve} disabled={!allSelected || computedTotalPrice <= 0} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-base font-extrabold rounded-xl transition-all shadow-md shadow-orange-200 active:scale-[0.98]">
                                Réserver maintenant
                            </button>
                            {!allSelected && hasSearched && availableRooms.length > 0 && (
                                <p className="text-center text-xs text-gray-400 mt-2.5">Sélectionnez une chambre par slot pour réserver</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default HotelDetails;
