// src/pages/HotelsSearchResultsPage.jsx
import {useEffect, useState, useMemo, useCallback} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {Calendar, Users, Moon, ArrowLeft, AlertTriangle} from 'lucide-react';
import HotelsListView from '../ui/HotelsListView.jsx';
import Loader from '../ui/Loader.jsx';
import {useQuery} from '@tanstack/react-query';
import apiClient from '../services/ApiClient';
import {normalizeHotelForCard} from '../utils/normalizeHotel'; // ✅ NEW

// ── SearchSummaryBanner ────────────────────────────────────────────────────────
function SearchSummaryBanner({countResults, allHotelsCount, searchCriteria, searchId, onBack}) {
    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
    };

    return (
        <div className="bg-white shadow-md mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                        Nouvelle recherche
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                                Résultats de recherche
                            </h1>
                            <p className="text-gray-600 text-base sm:text-lg">
                                {allHotelsCount} hôtel{allHotelsCount > 1 ? 's' : ''} chargé{allHotelsCount > 1 ? 's' : ''}
                                {countResults !== allHotelsCount && (
                                    <span className="text-sm text-gray-500 ml-2">
                                        sur {countResults} trouvés
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {searchCriteria?.checkIn && searchCriteria?.checkOut && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-lg border border-sky-100">
                                    <Calendar size={18} className="text-sky-600 flex-shrink-0"/>
                                    <span className="text-sm font-medium text-gray-700">
                                        {formatDate(searchCriteria.checkIn)} → {formatDate(searchCriteria.checkOut)}
                                    </span>
                                </div>
                            )}
                            {searchCriteria?.rooms && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
                                    <Users size={18} className="text-orange-600 flex-shrink-0"/>
                                    <span className="text-sm font-medium text-gray-700">
                                        {searchCriteria.rooms.length} chambre{searchCriteria.rooms.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            {searchCriteria?.nights && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                                    <Moon size={18} className="text-purple-600 flex-shrink-0"/>
                                    <span className="text-sm font-medium text-gray-700">
                                        {searchCriteria.nights} nuit{searchCriteria.nights > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {allHotelsCount > 50 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                            <p className="text-sm text-amber-800">
                                Grand nombre de résultats : {allHotelsCount} hôtels. Les résultats sont chargés progressivement.
                            </p>
                        </div>
                    )}

                    {searchId && import.meta.env.DEV && (
                        <p className="text-xs text-gray-400 mt-4">ID de recherche : {searchId}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── HotelsSearchResultsPage ───────────────────────────────────────────────────
function HotelsSearchResultsPage() {
    const location     = useLocation();
    const navigate     = useNavigate();
    const [searchParams] = useSearchParams();

    const stateData     = location.state;
    const checkIn       = searchParams.get('checkIn');
    const checkOut      = searchParams.get('checkOut');
    const roomsParam    = searchParams.get('rooms');
    const hotelIdsParam = searchParams.get('hotelIds');

    // ── Parse hotelIds ─────────────────────────────────────────────────────────
    const hotelIds = useMemo(() => {
        if (!hotelIdsParam) return null;
        try {
            return hotelIdsParam.split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        } catch {
            return null;
        }
    }, [hotelIdsParam]);

    // ── Parse rooms ────────────────────────────────────────────────────────────
    const rooms = useMemo(() => {
        try {
            const parsed = JSON.parse(roomsParam);
            return parsed.length > 0 ? parsed : [{adults: 2, children: []}];
        } catch {
            return [{adults: 2, children: []}];
        }
    }, [roomsParam]);

    // ── Derive nights once ─────────────────────────────────────────────────────
    const nights = useMemo(() => {
        const nightsParam = searchParams.get('nights');
        const parsed      = parseInt(nightsParam, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
        if (!checkIn || !checkOut) return 1;
        return Math.ceil(Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    }, [checkIn, checkOut, searchParams]);

    // ── Local state ────────────────────────────────────────────────────────────
    const [searchData,    setSearchData]    = useState(null);
    const [dataLoadError, setDataLoadError] = useState(null);

    // ── Load from location.state or sessionStorage ─────────────────────────────
    useEffect(() => {
        try {
            if (stateData) {
                const dataSize = JSON.stringify(stateData).length;
                if (dataSize > 1_048_576) {
                    if (import.meta.env.DEV) console.warn('Large dataset, moving to sessionStorage');
                    const searchId = `search_${Date.now()}`;
                    sessionStorage.setItem(searchId,            JSON.stringify(stateData));
                    sessionStorage.setItem('current_search_id', searchId);
                }
                setSearchData(stateData);
            } else {
                const currentSearchId = sessionStorage.getItem('current_search_id');
                if (currentSearchId) {
                    const storedData = sessionStorage.getItem(currentSearchId);
                    if (storedData) {
                        try { setSearchData(JSON.parse(storedData)); }
                        catch { setDataLoadError('Données corrompues dans le cache'); }
                    }
                }
            }
        } catch {
            setDataLoadError('Erreur lors du chargement des données');
        }
    }, [stateData]);

    // ── Step 1 — Fetch hotel details (batch) ──────────────────────────────────
    const {
        data:      hotelsDetailsData,
        isLoading: isLoadingDetails,
        isError:   isErrorDetails,
        error:     errorDetails,
    } = useQuery({
        queryKey: ['hotelDetailsForSearch', hotelIds],
        queryFn:  async () => {
            if (!hotelIds || hotelIds.length === 0)
                return {hotelsMap: {}, count: 0};
            const MAX_HOTELS    = 100;
            const limitedIds    = hotelIds.slice(0, MAX_HOTELS);
            if (import.meta.env.DEV && hotelIds.length > MAX_HOTELS)
                console.warn(`Limiting to ${MAX_HOTELS} hotels`);
            const batchSize = limitedIds.length > 50 ? 3 : 5;
            const hotelsMap = await apiClient.getHotelsBatch(
                limitedIds, batchSize, {delayBetweenBatches: 150}
            );
            return {
                hotelsMap,
                count:   Object.keys(hotelsMap).length,
                limited: hotelIds.length > MAX_HOTELS,
            };
        },
        enabled:   !searchData && !!hotelIds && hotelIds.length > 0,
        staleTime: 5 * 60 * 1000,
        retry:     1,
    });

    // ── Step 2 — Search hotels + pricing ──────────────────────────────────────
    const {
        data:      fetchedData,
        isLoading: isLoadingSearch,
        isError,
        error,
    } = useQuery({
        queryKey: ['hotelSearch', hotelIds, checkIn, checkOut, rooms],
        queryFn:  async () => {
            if (!hotelIds || hotelIds.length === 0) throw new Error('Aucun hôtel spécifié');
            if (!checkIn || !checkOut)               throw new Error('Dates de séjour manquantes');
            if (!rooms || rooms.length === 0)        throw new Error('Informations sur les chambres manquantes');

            const MAX_SEARCH = 100;
            const searchIds  = hotelIds.slice(0, MAX_SEARCH);
            const result     = await apiClient.searchHotel({
                checkIn, checkOut,
                hotels: searchIds,
                // ✅ consistent rooms shape
                rooms: rooms.map(room => ({
                    adult:     room.adults,
                    child:     Array.isArray(room.children) ? room.children.length : (room.children ?? 0),
                    childAges: Array.isArray(room.children) && room.children.length > 0
                        ? room.children
                        : Array.isArray(room.childAges) && room.childAges.length > 0
                            ? room.childAges
                            : undefined,
                })),
                filters: {keywords: '', category: '', onlyAvailable: true, tags: ''},
            });

            const hotelsMap = hotelsDetailsData?.hotelsMap ?? {};

            // ✅ normalizeHotelForCard applied here — search results get same shape
            const enrichedResults = result.hotelSearch.map(searchResult => {
                const hotelFromSearch = searchResult.Hotel;
                const fullDetails     = hotelsMap[hotelFromSearch.Id];

                let minPrice = null;
                let maxPrice = null;
                if (searchResult.Price?.Boarding) {
                    const allPrices = [];
                    for (const boarding of searchResult.Price.Boarding)
                        for (const pax of boarding.Pax)
                            for (const room of pax.Rooms)
                                if (room.Price) {
                                    const p = parseFloat(room.Price);
                                    if (!isNaN(p)) allPrices.push(p);
                                }
                    if (allPrices.length > 0) {
                        minPrice = Math.min(...allPrices);
                        maxPrice = Math.max(...allPrices);
                    }
                }

                // ✅ Build raw hotel object with all possible fields, then normalize
                const rawHotel = {
                    Id:               hotelFromSearch.Id,
                    Name:             fullDetails?.Name             ?? hotelFromSearch.Name,
                    Category:         fullDetails?.Category         ?? hotelFromSearch.Category,
                    City:             fullDetails?.City             ?? hotelFromSearch.City,
                    Adress:           fullDetails?.Adress           ?? hotelFromSearch.Adress,
                    Address:          fullDetails?.Address          ?? hotelFromSearch.Address,
                    Localization:     fullDetails?.Localization     ?? hotelFromSearch.Localization,
                    ShortDescription: fullDetails?.ShortDescription ?? hotelFromSearch.ShortDescription,
                    Description:      fullDetails?.Description      ?? fullDetails?.ShortDescription,
                    // ✅ Album: try fullDetails first, then fall back to hotelFromSearch
                    Image:            fullDetails?.Image            ?? hotelFromSearch.Image,
                    Album:            fullDetails?.Album            ?? hotelFromSearch.Album,
                    Facilities:       fullDetails?.Facilities?.slice(0, 10),
                    Theme:            fullDetails?.Theme?.slice(0, 5) ?? hotelFromSearch.Theme,
                    hasFullDetails:   !!fullDetails,
                };

                return {
                    Hotel:            normalizeHotelForCard(rawHotel), // ✅ normalized
                    MinPrice:         minPrice,
                    MaxPrice:         maxPrice,
                    Currency:         searchResult.Currency,
                    Token:            searchResult.Token,
                    Recommended:      searchResult.Recommended,
                    fullPriceDetails: searchResult.Price,
                    Tarif:            searchResult.Tarif ?? searchResult.Price,
                };
            });

            const finalData = {
                searchResults: enrichedResults,
                searchId:      result.searchId,
                countResults:  result.countResults,
                // ✅ nights from component scope — not re-derived downstream
                searchCriteria: {checkIn, checkOut, rooms, nights},
            };

            // Cache in sessionStorage if large
            const finalDataSize = JSON.stringify(finalData).length;
            if (finalDataSize > 524_288) {
                const sid = `search_${Date.now()}`;
                try {
                    sessionStorage.setItem(sid,                 JSON.stringify(finalData));
                    sessionStorage.setItem('current_search_id', sid);
                } catch {
                    if (import.meta.env.DEV) console.error('Failed to store in sessionStorage');
                }
            }
            return finalData;
        },
        enabled:   !searchData && !!hotelIds && !!checkIn && !!checkOut
            && rooms.length > 0 && !isLoadingDetails,
        staleTime: 2 * 60 * 1000,
        retry:     1,
    });

    // ── Consolidated effect: data / error / redirect ───────────────────────────
    useEffect(() => {
        if (isError && error) { setDataLoadError(error.message); return; }
        if (!searchData && fetchedData) { setSearchData(fetchedData); return; }
        const isLoadingAny = isLoadingDetails || isLoadingSearch;
        if (!isLoadingAny && !searchData && !fetchedData && !dataLoadError
            && (hotelIds === null) && !stateData) {
            if (import.meta.env.DEV) console.warn('No search data, redirecting home');
            navigate('/', {replace: true});
        }
    }, [isError, error, fetchedData, searchData, isLoadingDetails,
        isLoadingSearch, dataLoadError, hotelIds, stateData, navigate]);

    // ── Derived helpers ────────────────────────────────────────────────────────
    // allHotels — Hotel objects (already normalized inside enrichedResults)
    const allHotels = useMemo(() => {
        if (!searchData?.searchResults) return [];
        return searchData.searchResults.map(r => r.Hotel);
    }, [searchData]);

    const getTarifForHotel = useCallback((hotelId) => {
        const result = searchData?.searchResults?.find(r => r.Hotel?.Id === hotelId);
        return result?.fullPriceDetails ?? result?.Tarif ?? null;
    }, [searchData]);

    const handleBack = useCallback(() => {
        const sid = sessionStorage.getItem('current_search_id');
        if (sid) {
            sessionStorage.removeItem(sid);
            sessionStorage.removeItem('current_search_id');
        }
        navigate('/');
    }, [navigate]);

    // ── Loading ────────────────────────────────────────────────────────────────
    const isLoading = isLoadingDetails || isLoadingSearch;
    if (isLoading) {
        return (
            <Loader
                message="Chargement des résultats..."
                submessage={
                    hotelIds && hotelIds.length > 50
                        ? 'Traitement d\'un grand nombre d\'hôtels, veuillez patienter'
                        : 'Cette opération peut prendre quelques instants'
                }
                size="large"
                variant="gradient"
                fullHeight={true}
            />
        );
    }

    // ── Error ──────────────────────────────────────────────────────────────────
    const hasError      = isErrorDetails || isError || dataLoadError;
    const errorMessage  = dataLoadError ?? errorDetails?.message ?? error?.message;
    if (hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600"/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur de chargement</h2>
                    <p className="text-gray-600 mb-2">{errorMessage ?? 'Impossible de charger les résultats de recherche'}</p>
                    {hotelIds && hotelIds.length > 100 && (
                        <p className="text-sm text-orange-600 mb-6 p-3 bg-orange-50 rounded-lg">
                            Recherche de {hotelIds.length} hôtels détectée. Veuillez affiner votre recherche.
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => {
                                const sid = sessionStorage.getItem('current_search_id');
                                if (sid) {
                                    sessionStorage.removeItem(sid);
                                    sessionStorage.removeItem('current_search_id');
                                }
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold transition-all"
                        >
                            Nouvelle recherche
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!searchData) {
        return (
            <Loader
                message="Préparation des données..."
                size="medium"
                variant="gradient"
                fullHeight={true}
            />
        );
    }

    const {searchId = null, countResults = 0, searchCriteria = null} = searchData;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <HotelsListView
            hotels={allHotels}
            initialFilters={{}}
            showPricing={true}
            searchCriteria={searchCriteria}
            getTarifForHotel={getTarifForHotel}
            headerContent={
                <SearchSummaryBanner
                    countResults={countResults}
                    allHotelsCount={allHotels.length}
                    searchCriteria={searchCriteria}
                    searchId={searchId}
                    onBack={handleBack}
                />
            }
            isLoading={false}
            isError={false}
            error={null}
        />
    );
}

export default HotelsSearchResultsPage;
