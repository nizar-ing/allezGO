// src/components/LocationSearch.jsx
import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { MapPin, X, Hotel, Globe, ChevronRight, AlertCircle } from 'lucide-react';
import { useCities, useHotels } from '../../custom-hooks/useHotelQueries';
import useDebounce from '../../custom-hooks/useDebounce';

function LocationSearch({
                            selectedCity,
                            selectedHotel,
                            onCitySelect,
                            onHotelSelect,
                            onClear,
                        }) {
    const [inputValue, setInputValue] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isEditing, setIsEditing] = useState(false);

    const cityDropdownRef = useRef(null);
    const locationInputRef = useRef(null);

    const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
    const { data: hotels, isLoading: hotelsLoading, error: hotelsError } = useHotels();

    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log("Cities:", cities);
            console.log("Hotels:", hotels);
        }
    }, [cities, hotels]);

    const selectionLabel = useMemo(() => {
        if (selectedCity) {
            const cityName = selectedCity.Name || '';
            const countryName = selectedCity.Country?.Name || '';
            return `${cityName}${countryName ? `, ${countryName}` : ''}`;
        }
        if (selectedHotel) {
            const hotelName = selectedHotel.Name || '';
            const cityName = selectedHotel.City?.Name || '';
            return `${hotelName}${cityName ? `, ${cityName}` : ''}`;
        }
        return '';
    }, [selectedCity, selectedHotel]);

    // ✅ CORE FIX: single source of truth
    // inputValue is always what the input shows.
    // When not editing, keep it in sync with selectionLabel automatically.
    // This prevents the "ghost label" problem where inputValue is '' but
    // the input visually shows selectionLabel — causing typing to insert
    // characters into the label text instead of replacing it.
    useLayoutEffect(() => {
        if (!isEditing) {
            setInputValue(selectionLabel);
        }
    }, [selectionLabel, isEditing]);

    const debouncedSearch = useDebounce(inputValue, 300);

    const { combinedResults, citiesCount, hotelsCount } = useMemo(() => {
        const results = [];

        if (!debouncedSearch) {
            const citySlice = (cities || []).slice(0, 8);
            citySlice.forEach(city => results.push({ type: 'city', data: city }));
            return { combinedResults: results, citiesCount: citySlice.length, hotelsCount: 0 };
        }

        const searchLower = debouncedSearch
            .toLowerCase()
            .replace(/^\s+/, '')
            .replace(/\s{2,}/g, ' ');

        const filteredCities = (cities || [])
            .filter(city => {
                const cityName = city.Name?.toLowerCase() || '';
                const countryName = city.Country?.Name?.toLowerCase() || '';
                const regionName = city.Region?.toLowerCase() || '';
                return (
                    cityName.includes(searchLower) ||
                    countryName.includes(searchLower) ||
                    regionName.includes(searchLower)
                );
            })
            .slice(0, 5);

        filteredCities.forEach(city => results.push({ type: 'city', data: city }));

        const filteredHotels = (hotels || [])
            .filter(hotel => {
                const hotelName = hotel.Name?.toLowerCase() || '';
                const cityName = hotel.City?.Name?.toLowerCase() || '';
                const countryName = hotel.City?.Country?.Name?.toLowerCase() || '';
                return (
                    hotelName.includes(searchLower) ||
                    cityName.includes(searchLower) ||
                    countryName.includes(searchLower)
                );
            })
            .slice(0, 5);

        filteredHotels.forEach(hotel => results.push({ type: 'hotel', data: hotel }));

        return {
            combinedResults: results,
            citiesCount: filteredCities.length,
            hotelsCount: filteredHotels.length,
        };
    }, [cities, hotels, debouncedSearch]);

    // Click outside: stop editing → useLayoutEffect syncs inputValue back to selectionLabel
    useEffect(() => {
        function handleClickOutside(event) {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
                setHighlightedIndex(-1);
                setIsEditing(false); // triggers useLayoutEffect to restore label
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (highlightedIndex >= 0 && cityDropdownRef.current) {
            cityDropdownRef.current
                .querySelector(`[data-index="${highlightedIndex}"]`)
                ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [highlightedIndex]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleLocationChange = useCallback((e) => {
        const next = e.target.value;
        setInputValue(next);
        setIsEditing(true);
        if (selectedCity || selectedHotel) {
            onClear();
        }
        setShowCityDropdown(true);
        setHighlightedIndex(-1);
    }, [onClear, selectedCity, selectedHotel]);

    const handleCitySelect = useCallback((city) => {
        setIsEditing(false); // triggers useLayoutEffect → inputValue = new city label
        onCitySelect(city);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    }, [onCitySelect]);

    const handleHotelSelect = useCallback((hotel) => {
        setIsEditing(false); // triggers useLayoutEffect → inputValue = new hotel label
        onHotelSelect(hotel);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    }, [onHotelSelect]);

    const handleClearLocation = useCallback(() => {
        setIsEditing(false);
        onClear();
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
        locationInputRef.current?.focus();
    }, [onClear]);

    const handleLocationKeyDown = useCallback((e) => {
        if (!showCityDropdown || combinedResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < combinedResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < combinedResults.length) {
                    const selected = combinedResults[highlightedIndex];
                    if (selected.type === 'city') handleCitySelect(selected.data);
                    else handleHotelSelect(selected.data);
                }
                break;
            case 'Escape':
                setShowCityDropdown(false);
                setHighlightedIndex(-1);
                setIsEditing(false); // triggers useLayoutEffect to restore label
                break;
            default:
                break;
        }
    }, [showCityDropdown, combinedResults, highlightedIndex, handleCitySelect, handleHotelSelect]);

    return (
        <div className="relative" ref={cityDropdownRef}>
            <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white">
                <MapPin className="text-sky-600 flex-shrink-0" size={22} />
                <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Ville ou hôtel..."
                    value={inputValue}
                    onChange={handleLocationChange}
                    onKeyDown={handleLocationKeyDown}
                    onFocus={() => {
                        setShowCityDropdown(true);
                        setIsEditing(true);
                        // inputValue already equals selectionLabel (set by useLayoutEffect).
                        // Select all so the first keystroke replaces it cleanly.
                        requestAnimationFrame(() => {
                            locationInputRef.current?.select();
                        });
                    }}
                    className="flex-1 outline-none text-gray-800 text-sm placeholder-gray-500"
                    autoComplete="off"
                />
                {inputValue && (
                    <button onClick={handleClearLocation} className="text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                )}
            </div>

            {showCityDropdown && (inputValue || isEditing) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 max-h-[400px] overflow-hidden animate-slideDown">
                    {(citiesLoading || hotelsLoading) && (
                        <div className="p-6 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="relative w-10 h-10">
                                    <div className="absolute inset-0 border-4 border-sky-100 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Recherche...</p>
                            </div>
                        </div>
                    )}

                    {(citiesError || hotelsError) && (
                        <div className="p-6 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-red-600 mb-1">Erreur de chargement</p>
                                    <p className="text-xs text-gray-500">Impossible de charger les données</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!citiesLoading && !hotelsLoading && !citiesError && !hotelsError && combinedResults.length === 0 && (
                        <div className="p-6 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                    <MapPin className="text-gray-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Aucun résultat trouvé</p>
                                    <p className="text-xs text-gray-500">Essayez avec un autre nom</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!citiesLoading && !hotelsLoading && !citiesError && !hotelsError && combinedResults.length > 0 && (
                        <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                            <div className="sticky top-0 bg-gradient-to-b from-gray-50 to-transparent px-4 py-2 border-b border-gray-100 z-10">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {citiesCount} {citiesCount === 1 ? 'ville' : 'villes'} · {hotelsCount} {hotelsCount === 1 ? 'hôtel' : 'hôtels'}
                                </p>
                            </div>

                            <ul className="py-1">
                                {combinedResults.map((result, index) => {
                                    const isHighlighted = highlightedIndex === index;

                                    if (result.type === 'city') {
                                        const city = result.data;
                                        return (
                                            <li
                                                key={`city-${city.Id}`}
                                                data-index={index}
                                                onClick={() => handleCitySelect(city)}
                                                className={`px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 mx-2 rounded-lg my-1 ${
                                                    isHighlighted
                                                        ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-500 shadow-sm scale-[1.02]'
                                                        : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 p-2 rounded-lg transition-all duration-200 ${
                                                        isHighlighted ? 'bg-sky-100 scale-110' : 'bg-gray-100'
                                                    }`}>
                                                        <MapPin
                                                            size={20}
                                                            className={`transition-colors duration-200 ${
                                                                isHighlighted ? 'text-sky-600' : 'text-gray-400'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className={`font-semibold text-sm transition-colors duration-200 ${
                                                                isHighlighted ? 'text-sky-700' : 'text-gray-800'
                                                            }`}>
                                                                {city.Name || ''}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                Ville
                                                            </span>
                                                        </div>
                                                        {city.Region && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                                                                <MapPin size={12} />
                                                                <span className="truncate">{city.Region}</span>
                                                            </div>
                                                        )}
                                                        {city.Country?.Name && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                <Globe size={12} />
                                                                <span className="truncate">{city.Country.Name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isHighlighted && (
                                                        <ChevronRight size={20} className="mt-1 text-sky-600 animate-pulse" />
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    }

                                    const hotel = result.data;
                                    return (
                                        <li
                                            key={`hotel-${hotel.Id}`}
                                            data-index={index}
                                            onClick={() => handleHotelSelect(hotel)}
                                            className={`px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 mx-2 rounded-lg my-1 ${
                                                isHighlighted
                                                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500 shadow-sm scale-[1.02]'
                                                    : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 p-2 rounded-lg transition-all duration-200 ${
                                                    isHighlighted ? 'bg-amber-100 scale-110' : 'bg-gray-100'
                                                }`}>
                                                    <Hotel
                                                        size={18}
                                                        className={`transition-colors duration-200 ${
                                                            isHighlighted ? 'text-amber-600' : 'text-gray-400'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`font-semibold text-sm transition-colors duration-200 ${
                                                            isHighlighted ? 'text-amber-700' : 'text-gray-800'
                                                        }`}>
                                                            {hotel.Name || ''}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                            Hôtel
                                                        </span>
                                                    </div>
                                                    {hotel.Category?.Star && (
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-0.5">
                                                            <span>⭐ {hotel.Category.Star} étoiles</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <MapPin size={12} />
                                                        <span className="truncate">{hotel.City?.Name || ''}</span>
                                                    </div>
                                                </div>
                                                {isHighlighted && (
                                                    <ChevronRight size={20} className="mt-1 text-amber-600 animate-pulse" />
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LocationSearch;
