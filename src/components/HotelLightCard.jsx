// src/components/HotelLightCard.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, MapPin, Star, Wifi, Car, Utensils, Waves, Wind, Coffee,
    Dumbbell, Sparkles, ChevronRight, CheckCircle2, AlertCircle,
    ChevronDown, ChevronUp, Loader2, Baby,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/ApiClient';

// ── Utilities ──────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('fr-DZ').format(price);
};

const stripHtml = (html = '') => {
    if (!html) return '';
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const text = doc.body.textContent || '';
        return text.replace(/\s+/g, ' ').trim();
    } catch {
        return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    }
};

const getFacilityIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('wifi') || t.includes('internet')) return Wifi;
    if (t.includes('parking')) return Car;
    if (t.includes('restaurant') || t.includes('bar')) return Utensils;
    if (t.includes('piscine') || t.includes('plage')) return Waves;
    if (t.includes('climatisation')) return Wind;
    if (t.includes('café') || t.includes('petit')) return Coffee;
    if (t.includes('sport') || t.includes('gym')) return Dumbbell;
    if (t.includes('spa') || t.includes('bien')) return Sparkles;
    return CheckCircle2;
};

// ✅ FreeChild utility
const getFreeChildInfo = (freeChild) => {
    if (!Array.isArray(freeChild) || freeChild.length === 0) return null;
    const maxAge = Math.max(...freeChild.map((fc) => fc.Age));
    return { count: freeChild.length, maxAge };
};

const buildBoardingFromRooms = (rooms) => {
    if (!rooms?.length) return [];
    const map = new Map();
    rooms.forEach(room => {
        if (!map.has(room.boardingCode))
            map.set(room.boardingCode, { code: room.boardingCode, label: room.boardingName });
    });
    return Array.from(map.values());
};

// ✅ FIX #1 — correct base path /hotel/ (not /hotels/)
const buildDetailUrl = (hotelId, searchParams) => {
    const p = new URLSearchParams();
    if (searchParams?.checkIn)  p.set('checkin',  searchParams.checkIn);
    if (searchParams?.checkOut) p.set('checkout', searchParams.checkOut);
    if (searchParams?.rooms?.length) {
        try {
            const normalized = searchParams.rooms.map(r => ({
                adults:    r.adults ?? 2,
                children:  Array.isArray(r.children) ? r.children.length : (r.children ?? 0),
                childAges: Array.isArray(r.children) ? r.children : (r.childAges ?? []),
            }));
            p.set('rooms', encodeURIComponent(JSON.stringify(normalized)));
        } catch { /* skip */ }
    }
    const qs = p.toString();
    return `/hotel/${hotelId}${qs ? `?${qs}` : ''}`;
};

// ── Component ──────────────────────────────────────────────────────────────────
function HotelLightCard({
                            hotel,
                            onFavoriteToggle,
                            pricing = null,
                            preloadedAvailability = null,
                            onBook = null,
                            onViewDetail = null,
                            showBookButton = false,
                            nights = 1,
                            searchParams = null,
                            initialIsFavorite = false,
                        }) {
    const navigate = useNavigate();

    const cardRef        = useRef(null);
    const showTarifsRef  = useRef(false);

    const [isFavorite,       setIsFavorite]       = useState(initialIsFavorite);
    const [imageLoaded,      setImageLoaded]      = useState(false);
    const [showTarifs,       setShowTarifs]       = useState(false);
    const [isLoading,        setIsLoading]        = useState(false);
    const [allRooms,         setAllRooms]         = useState(() => preloadedAvailability ?? []);
    const [availableBoarding,setAvailableBoarding]= useState(() => buildBoardingFromRooms(preloadedAvailability));
    const [selectedBoarding, setSelectedBoarding] = useState(() => preloadedAvailability?.[0]?.boardingCode ?? null);
    const [noAvailability,   setNoAvailability]   = useState(() => preloadedAvailability !== null && preloadedAvailability.length === 0);
    const [hasFetched,       setHasFetched]       = useState(() => preloadedAvailability !== null);
    const [roomsByPax,       setRoomsByPax]       = useState([]);
    const [selectedRooms,    setSelectedRooms]    = useState({});

    useEffect(() => {
        if (preloadedAvailability === null) return;
        const boarding = buildBoardingFromRooms(preloadedAvailability);
        setAllRooms(preloadedAvailability);
        setAvailableBoarding(boarding);
        setSelectedBoarding(boarding[0]?.code ?? null);
        setNoAvailability(preloadedAvailability.length === 0);
        setHasFetched(true);
        setRoomsByPax([]);
        setSelectedRooms({});
    }, [preloadedAvailability]);

    // ✅ FreeChild destructured
    const {
        Id, Name, Category, City,
        ShortDescription, Description,
        Image, Album = [], Facilities = [], FreeChild,
    } = hotel;

    const hotelImage = useMemo(() => {
        if (Album.length > 0) return Album[0];
        return Image || 'https://loremflickr.com/600/400/hotel,luxury?lock=42';
    }, [Album, Image]);

    const shortDesc = useMemo(() => stripHtml(ShortDescription || Description || ''), [ShortDescription, Description]);

    const stars = useMemo(
        () => (Category?.Star ? Array(Math.min(Category.Star, 5)).fill(0) : []),
        [Category?.Star]
    );

    const topFacilities = useMemo(() => Facilities.slice(0, 4), [Facilities]);

    const filteredRooms = useMemo(() => {
        if (!selectedBoarding) return allRooms;
        return allRooms.filter(r => r.boardingCode === selectedBoarding);
    }, [allRooms, selectedBoarding]);

    const totalPrice = useMemo(() => {
        if (!pricing?.minPrice || !nights) return null;
        return pricing.minPrice * nights;
    }, [pricing?.minPrice, nights]);

    const detailUrl = useMemo(() => buildDetailUrl(Id, searchParams), [Id, searchParams]);

    // ✅ FreeChild computed
    const freeChildInfo = useMemo(() => getFreeChildInfo(FreeChild), [FreeChild]);

    const effectiveRoomsByPax = useMemo(() => {
        if (roomsByPax.length > 0) return roomsByPax;
        const requestedRooms = searchParams?.rooms ?? [];
        if (requestedRooms.length === 0 || allRooms.length === 0) return [];

        // Build adultCount → rooms lookup (mirrors ApiClient._processRoomsByPax)
        const adultCountToRooms = new Map();
        allRooms.forEach(room => {
            const key = room.adults ?? 2;
            if (!adultCountToRooms.has(key)) adultCountToRooms.set(key, []);
            adultCountToRooms.get(key).push(room);
        });
        const availableCounts = Array.from(adultCountToRooms.keys()).sort((a, b) => a - b);

        return requestedRooms.map((room, idx) => {
            const requestedAdults = room.adults ?? 2;
            // Exact match first, then closest-count fallback
            let matchedRooms = adultCountToRooms.get(requestedAdults) ?? [];
            if (matchedRooms.length === 0 && availableCounts.length > 0) {
                const closest = availableCounts.reduce((prev, curr) =>
                    Math.abs(curr - requestedAdults) < Math.abs(prev - requestedAdults) ? curr : prev
                );
                matchedRooms = adultCountToRooms.get(closest) ?? [];
            }
            return {
                paxIndex:  idx,
                adults:    requestedAdults,
                children:  room.children  ?? 0,
                childAges: room.childAges ?? [],
                rooms:     [...matchedRooms].sort((a, b) => a.price - b.price),
            };
        });
    }, [roomsByPax, allRooms, searchParams?.rooms]);


    const computedTotalPrice = useMemo(() => {
        if (!effectiveRoomsByPax.length || !selectedBoarding) return null;
        let total = 0;
        for (let i = 0; i < effectiveRoomsByPax.length; i++) {
            const roomId = selectedRooms[i];
            const room = effectiveRoomsByPax[i]?.rooms.find(
                r => r.id === roomId && r.boardingCode === selectedBoarding
            );
            if (!room?.price) return null;
            total += room.price * nights;
        }
        return total;
    }, [effectiveRoomsByPax, selectedRooms, selectedBoarding, nights]);

    const fetchAvailability = useCallback(async () => {
        if (!searchParams?.checkIn || !searchParams?.checkOut) return;
        setIsLoading(true);
        setNoAvailability(false);
        setAllRooms([]);
        setAvailableBoarding([]);
        setSelectedBoarding(null);
        setRoomsByPax([]);
        setSelectedRooms({});
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
            const boarding     = buildBoardingFromRooms(response.rooms);
            const firstCode    = boarding[0]?.code ?? null;
            const paxData      = response.roomsByPax ?? [];
            setAllRooms(response.rooms);
            setAvailableBoarding(boarding);
            setSelectedBoarding(firstCode);
            setRoomsByPax(paxData);
            setHasFetched(true);
            setSelectedRooms({});
        } catch (err) {
            if (!err.isCancelled) {
                if (showTarifsRef.current) toast.error('Erreur lors de la recherche de disponibilités.');
                setNoAvailability(true);
                setAvailableBoarding([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [Id, searchParams]);

    useEffect(() => {
        if (!searchParams?.checkIn || !searchParams?.checkOut) return;
        if (hasFetched) return;
        const el = cardRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    void fetchAvailability();
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [searchParams, hasFetched, fetchAvailability]);

    const handleToggleTarifs = useCallback(() => {
        const next = !showTarifs;
        showTarifsRef.current = next;
        setShowTarifs(next);
        if (next && !hasFetched) void fetchAvailability();
    }, [showTarifs, hasFetched, fetchAvailability]);

    const handleRefresh = useCallback(() => void fetchAvailability(), [fetchAvailability]);

    const handleBoardingChange = useCallback((code) => {
        setSelectedBoarding(code);
        setSelectedRooms({});
    }, []);

    const handleFavoriteClick = useCallback((e) => {
        e.stopPropagation();
        const next = !isFavorite;
        setIsFavorite(next);
        onFavoriteToggle?.(Id, next);
        toast.success(next ? 'Ajouté aux favoris' : 'Retiré des favoris');
    }, [isFavorite, Id, onFavoriteToggle]);

    // ✅ FIX #2 — handleBook uses detailUrl (not /hotels-search)
    const handleBook = useCallback((room) => {
        if (onBook) { onBook(hotel, room); return; }
        navigate(detailUrl);
    }, [onBook, hotel, navigate, detailUrl]);

    // ✅ FIX #2 — handleBookAll uses detailUrl (not /hotels-search)
    const handleBookAll = useCallback(() => {
        const selectedRoomsList = effectiveRoomsByPax
            .map((pax, idx) =>
                pax.rooms.find(r => r.id === selectedRooms[idx] && r.boardingCode === selectedBoarding) ?? null
            )
            .filter(Boolean);
        if (onBook) { onBook(hotel, selectedRoomsList); return; }
        navigate(detailUrl);
    }, [effectiveRoomsByPax, selectedRooms, selectedBoarding, onBook, hotel, navigate, detailUrl]);

    const handleViewDetail = useCallback(() => {
        if (onViewDetail) { onViewDetail(Id); return; }
        navigate(detailUrl);
    }, [onViewDetail, navigate, Id, detailUrl]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            ref={cardRef}
            className="group bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        >
            {/* ── Card top: image + content ── */}
            <div className="flex flex-col sm:flex-row min-h-[220px] sm:min-h-[210px]">

                {/* ── Image ── */}
                <div className="relative sm:w-80 lg:w-[360px] shrink-0 overflow-hidden bg-gray-200">
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                    )}
                    <img
                        src={hotelImage}
                        alt={Name}
                        className={`w-full h-60 sm:h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => { e.target.src = 'https://loremflickr.com/600/400/hotel,luxury?lock=42'; setImageLoaded(true); }}
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Stars badge */}
                    {stars.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-sm">
                            {stars.map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400 drop-shadow" />)}
                        </div>
                    )}

                    {/* Favorite */}
                    <button
                        onClick={handleFavoriteClick}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
                            isFavorite ? 'bg-rose-500 border border-rose-400' : 'bg-white/80 border border-white/50 hover:bg-white'
                        }`}
                        aria-label="Favoris"
                    >
                        <Heart size={15} className={isFavorite ? 'fill-white text-white' : 'text-gray-500'} />
                    </button>

                    {/* Price overlay */}
                    {pricing?.minPrice && (
                        <div className="absolute bottom-3 right-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-lg border border-orange-300/30">
                            <div className="text-[10px] font-normal opacity-80 tracking-wide uppercase">À partir de</div>
                            <div className="text-sm font-extrabold">{formatPrice(totalPrice ?? pricing.minPrice)} <span className="font-normal opacity-80 text-[11px]">DZD</span></div>
                            {nights > 1 && <div className="text-[10px] font-normal opacity-75">{formatPrice(pricing.minPrice)} / nuit</div>}
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col gap-2.5 min-w-0">

                    {/* ✅ Name + FreeChild badge */}
                    <div className="flex items-start gap-2 lg:gap-4 flex-wrap">
                        <h3 className="text-base lg:text-xl font-extrabold text-gray-600 leading-tight tracking-tight">{Name}</h3>
                        {freeChildInfo && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-xs text-white border border-emerald-400 font-bold px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                                <Baby size={13} />
                                {freeChildInfo.count} enfant{freeChildInfo.count > 1 ? 's' : ''} gratuit{freeChildInfo.count > 1 ? 's' : ''} jusqu'à {freeChildInfo.maxAge} ans
                            </span>
                        )}
                    </div>

                    {/* City */}
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <MapPin size={13} className="text-sky-500 shrink-0" />
                        {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ''}
                    </p>

                    {/* Description */}
                    {shortDesc && (
                        <p className="text-xs lg:text-sm text-gray-500 line-clamp-2 leading-relaxed">{shortDesc}</p>
                    )}

                    {/* Facilities */}
                    {topFacilities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {topFacilities.map((f, i) => {
                                const Icon = getFacilityIcon(f.Title || '');
                                return (
                                    <span key={f.Title ?? i} className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                        <Icon size={10} className="text-sky-500 shrink-0" />{f.Title}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Nights + guests */}
                    {searchParams && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                🌙 {nights} nuit{nights > 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                👤 {searchParams.rooms?.reduce((s, r) => s + (r.adults || 0), 0)} adulte(s)
                            </span>
                            {searchParams.rooms?.length > 1 && (
                                <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                    🛏 {searchParams.rooms.length} chambres
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex-1" />

                    {/* Price + action buttons */}
                    <div className="flex items-end justify-between gap-3 mt-1 flex-wrap pt-2 border-t border-gray-100">
                        {pricing?.minPrice ? (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">À partir de</p>
                                <p className="text-xl font-extrabold text-sky-700 leading-none">
                                    {formatPrice(totalPrice ?? pricing.minPrice)}
                                    <span className="text-sm font-semibold text-gray-400 ml-1">DZD</span>
                                </p>
                                {nights > 1
                                    ? <p className="text-[11px] text-gray-400 mt-0.5">{nights} nuits · {formatPrice(pricing.minPrice)} DZD / nuit</p>
                                    : <p className="text-[11px] text-gray-400 mt-0.5">/ nuit · par chambre</p>
                                }
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tarif</p>
                                <p className="text-sm font-semibold text-gray-400 italic">Sur demande</p>
                            </div>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleViewDetail}
                                className="px-4 py-2 border-2 border-sky-200 text-sky-700 text-xs font-bold rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all duration-200"
                            >
                                Détail
                            </button>
                            <button
                                onClick={handleToggleTarifs}
                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm ${
                                    showTarifs
                                        ? 'bg-sky-700 text-white shadow-sky-200'
                                        : 'bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-sky-200/60'
                                }`}
                            >
                                Tarifs & Chambres
                                {showTarifs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tarifs panel ── */}
            {showTarifs && (
                <div className="border-t-2 border-sky-100 bg-gradient-to-b from-slate-50 to-sky-50/40 px-5 sm:px-6 py-5">

                    {/* Panel header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-sky-700 rounded-full" />
                            <span className="text-sm font-extrabold text-gray-800 tracking-tight">Choisissez votre formule</span>
                        </div>
                        {hasFetched && !isLoading && (
                            <button onClick={handleRefresh} className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
                                ↻ Actualiser
                            </button>
                        )}
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-3 py-10">
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                                <Loader2 size={20} className="animate-spin text-sky-600" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Recherche des disponibilités...</span>
                        </div>
                    )}

                    {/* No availability */}
                    {!isLoading && noAvailability && (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200">
                                <AlertCircle size={22} className="text-amber-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">Aucune disponibilité pour ces dates</p>
                            <p className="text-xs text-gray-400 max-w-xs">Veuillez modifier vos dates ou consulter la fiche complète.</p>
                            <button onClick={handleViewDetail} className="text-xs text-sky-600 underline underline-offset-2 font-semibold hover:text-sky-800 transition-colors">
                                Voir la fiche hôtel →
                            </button>
                        </div>
                    )}

                    {/* Boarding tabs + rooms */}
                    {!isLoading && !noAvailability && availableBoarding.length > 0 && (
                        <>
                            {/* Boarding tabs */}
                            <div className="flex gap-2 flex-wrap mb-5 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit max-w-full">
                                {availableBoarding.map(board => (
                                    <button
                                        key={board.code}
                                        onClick={() => handleBoardingChange(board.code)}
                                        className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                                            selectedBoarding === board.code
                                                ? 'bg-gradient-to-r from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200'
                                                : 'text-gray-500 hover:text-sky-700 hover:bg-sky-50'
                                        }`}
                                    >
                                        {board.label}
                                    </button>
                                ))}
                            </div>

                            {/* Per-pax room selectors */}
                            {effectiveRoomsByPax.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {effectiveRoomsByPax.map((pax, idx) => {
                                        const paxRooms    = pax.rooms.filter(r => r.boardingCode === selectedBoarding);
                                        const selectedRoom = paxRooms.find(r => r.id === selectedRooms[idx]) ?? paxRooms[0];
                                        return (
                                            <div key={idx} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-sky-600 rounded-l-2xl" />
                                                <div className="p-4 pl-5">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="w-7 h-7 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm shadow-sky-200 shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-800">
                                                            Chambre {idx + 1}
                                                            <span className="mx-1.5 text-gray-300">—</span>
                                                            <span className="text-sky-600 font-extrabold">{pax.adults} adulte{pax.adults > 1 ? 's' : ''}</span>
                                                        </span>
                                                    </div>
                                                    {paxRooms.length === 0 ? (
                                                        <p className="text-xs text-gray-400 italic pl-1">Aucune chambre disponible pour cette formule</p>
                                                    ) : (
                                                        <>
                                                            <div className="relative">
                                                                <select
                                                                    value={selectedRooms[idx] ?? ''}
                                                                    onChange={(e) => setSelectedRooms(prev => ({ ...prev, [idx]: e.target.value }))}
                                                                    className="w-full appearance-none border-2 border-gray-100 focus:border-sky-400 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer font-medium transition-all duration-150"
                                                                >
                                                                    <option value="" disabled>— Sélectionnez le type de votre chambre —</option>
                                                                    {paxRooms.map(room => (
                                                                        <option key={room.id} value={room.id}>
                                                                            {room.name} — {formatPrice(room.price * nights)} DZD
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                            </div>
                                                            {selectedRoom && (
                                                                <div className="mt-2.5 flex items-center justify-between bg-sky-50 rounded-xl px-3 py-2">
                                                                    <span className="text-[11px] text-sky-600 font-semibold">{selectedRoom.boardingName}</span>
                                                                    <div className="flex items-baseline gap-1.5">
                                                                        <span className="text-sm font-extrabold text-sky-700">{formatPrice(selectedRoom.price * nights)}</span>
                                                                        <span className="text-[11px] font-semibold text-sky-500">DZD</span>
                                                                        {nights > 1 && <span className="text-[10px] text-gray-400 ml-1">· {formatPrice(selectedRoom.price)} / nuit</span>}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Total + Réserver */}
                                    <div className="mt-1 bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 rounded-2xl p-4 shadow-lg shadow-sky-200/50 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-sky-200 mb-1 font-medium tracking-wide">
                                                Total · {effectiveRoomsByPax.length} chambre{effectiveRoomsByPax.length > 1 ? 's' : ''} · {nights} nuit{nights > 1 ? 's' : ''}
                                            </p>
                                            {computedTotalPrice != null ? (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-2xl font-extrabold text-white tracking-tight">{formatPrice(computedTotalPrice)}</span>
                                                    <span className="text-sm font-semibold text-sky-200">DZD</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-sky-300 italic">Sélectionnez toutes les chambres</p>
                                            )}
                                        </div>
                                        {showBookButton && (
                                            <button
                                                onClick={handleBookAll}
                                                disabled={computedTotalPrice == null}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-extrabold rounded-2xl transition-all duration-200 shadow-lg shadow-orange-400/40 active:scale-95 shrink-0"
                                            >
                                                Réserver <ChevronRight size={16} className="shrink-0" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                            ) : filteredRooms.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-400 font-medium">Aucune chambre disponible pour cette formule.</p>
                                </div>

                            ) : (
                                /* Flat list fallback */
                                <div className="flex flex-col divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {filteredRooms.map(room => {
                                        const roomTotal = room.price != null && nights >= 1 ? room.price * nights : room.price;
                                        return (
                                            <div key={room.id} className="flex items-center justify-between px-4 py-3 hover:bg-sky-50/50 transition-colors group/row">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 group-hover/row:text-sky-700 transition-colors">{room.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{room.boardingName}</p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-sm font-extrabold text-sky-700">
                                                            {formatPrice(roomTotal)} <span className="text-[11px] font-normal text-gray-400">{room.currency}</span>
                                                        </p>
                                                        {nights > 1 && <p className="text-[11px] text-gray-400">{formatPrice(room.price)} / nuit</p>}
                                                    </div>
                                                    {showBookButton && (
                                                        <button
                                                            onClick={() => handleBook(room)}
                                                            className="px-3.5 py-2 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-xs font-extrabold rounded-xl transition-all duration-200 shadow-sm shadow-orange-200 active:scale-95"
                                                        >
                                                            Réserver
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-medium">
                                    {effectiveRoomsByPax.length > 0
                                        ? `${effectiveRoomsByPax.length} chambre${effectiveRoomsByPax.length > 1 ? 's' : ''} sélectionnée${effectiveRoomsByPax.length > 1 ? 's' : ''}`
                                        : `${filteredRooms.length} chambre${filteredRooms.length > 1 ? 's' : ''} disponible${filteredRooms.length > 1 ? 's' : ''}`
                                    }
                                </span>
                                <button onClick={handleViewDetail} className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:gap-1.5 transition-all">
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
