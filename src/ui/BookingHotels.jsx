import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn, MdClose } from "react-icons/md";
import { BsCalendar3, BsSearch } from "react-icons/bs";
import { HiUsers } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { IoAddOutline, IoCheckmark, IoTrashOutline } from "react-icons/io5";
import { FaHotel } from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "./Button.jsx";
import { useCities, useHotels } from "../custom-hooks/useHotelQueries";
import useDebounce from "../custom-hooks/useDebounce";

function BookingHotels() {
    const navigate = useNavigate();

    const [location, setLocation] = useState("");
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [selectionType, setSelectionType] = useState(null);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const [range, setRange] = useState({ from: null, to: null });
    const [rooms, setRooms] = useState([
        { id: 1, adults: 2, children: [], babies: 0 }
    ]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const datePickerRef = useRef(null);
    const guestPickerRef = useRef(null);
    const cityDropdownRef = useRef(null);
    const locationInputRef = useRef(null);

    // Fetch cities and hotels from API using React Query
    const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
    const { data: hotels, isLoading: hotelsLoading, error: hotelsError } = useHotels();

    // Development logging only
    if (process.env.NODE_ENV === 'development') {
        console.log("Cities:", cities);
        console.log("Hotels:", hotels);
    }

    // Debounce search input for better performance
    const debouncedSearch = useDebounce(location, 300);

    // Combined filtering of cities AND hotels
    const filteredResults = React.useMemo(() => {
        if (!debouncedSearch) {
            return { cities: cities || [], hotels: [] };
        }

        const searchLower = debouncedSearch.toLowerCase().trim();

        // Filter cities (max 5)
        const matchedCities = (cities || []).filter((city) => {
            const cityName = city.Name?.toLowerCase() || '';
            const countryName = city.Country?.Name?.toLowerCase() || '';
            const regionName = city.Region?.toLowerCase() || '';

            return cityName.includes(searchLower) ||
                countryName.includes(searchLower) ||
                regionName.includes(searchLower);
        }).slice(0, 5);

        // Filter hotels (max 5)
        const matchedHotels = (hotels || []).filter((hotel) => {
            const hotelName = hotel.Name?.toLowerCase() || '';
            const cityName = hotel.City?.Name?.toLowerCase() || '';
            const countryName = hotel.City?.Country?.Name?.toLowerCase() || '';

            return hotelName.includes(searchLower) ||
                cityName.includes(searchLower) ||
                countryName.includes(searchLower);
        }).slice(0, 5);

        return { cities: matchedCities, hotels: matchedHotels };
    }, [cities, hotels, debouncedSearch]);

    // Combine cities and hotels for dropdown (cities first, then hotels)
    const combinedResults = React.useMemo(() => {
        const results = [];

        // Add cities first
        filteredResults.cities.forEach(city => {
            results.push({ type: 'city', data: city });
        });

        // Add hotels after
        filteredResults.hotels.forEach(hotel => {
            results.push({ type: 'hotel', data: hotel });
        });

        return results;
    }, [filteredResults]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
            if (guestPickerRef.current && !guestPickerRef.current.contains(event.target)) {
                setShowGuestPicker(false);
            }
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
                setHighlightedIndex(-1);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && cityDropdownRef.current) {
            const highlightedElement = cityDropdownRef.current.querySelector(
                `[data-index="${highlightedIndex}"]`
            );
            highlightedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [highlightedIndex]);

    // Handle location input change
    const handleLocationChange = (e) => {
        const value = e.target.value;
        setLocation(value);
        setSelectedCity(null);
        setSelectedHotel(null);
        setSelectionType(null);
        setShowCityDropdown(true);
        setHighlightedIndex(-1);
    };

    // Handle city selection
    const handleCitySelect = (city) => {
        const cityName = city.Name || '';
        const countryName = city.Country?.Name || '';

        setLocation(`${cityName}${countryName ? `, ${countryName}` : ''}`);
        setSelectedCity(city);
        setSelectedHotel(null);
        setSelectionType('city');
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    };

    // Handle hotel selection
    const handleHotelSelect = (hotel) => {
        const hotelName = hotel.Name || '';
        const cityName = hotel.City?.Name || '';

        setLocation(`${hotelName}${cityName ? `, ${cityName}` : ''}`);
        setSelectedHotel(hotel);
        setSelectedCity(hotel.City || null);
        setSelectionType('hotel');
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    };

    // Clear location
    const handleClearLocation = () => {
        setLocation("");
        setSelectedCity(null);
        setSelectedHotel(null);
        setSelectionType(null);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
        locationInputRef.current?.focus();
    };

    // Keyboard navigation for dropdown
    const handleLocationKeyDown = (e) => {
        if (!showCityDropdown || combinedResults.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < combinedResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < combinedResults.length) {
                    const selected = combinedResults[highlightedIndex];
                    if (selected.type === 'city') {
                        handleCitySelect(selected.data);
                    } else {
                        handleHotelSelect(selected.data);
                    }
                }
                break;
            case 'Escape':
                setShowCityDropdown(false);
                setHighlightedIndex(-1);
                break;
            default:
                break;
        }
    };

    const formatDate = (date) => {
        if (!date) return "";
        const days = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
        const months = [
            "jan.", "fév.", "mars", "avr.", "mai", "juin",
            "juil.", "août", "sept.", "oct.", "nov.", "déc.",
        ];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    };

    const calculateNights = () => {
        if (range.from && range.to) {
            const diffTime = Math.abs(range.to - range.from);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        return 1;
    };

    const getTotalGuests = () => {
        const totalAdults = rooms.reduce((sum, room) => sum + room.adults, 0);
        const totalChildren = rooms.reduce((sum, room) => sum + room.children.length, 0);
        return { adults: totalAdults, children: totalChildren };
    };

    const updateRoomAdults = (roomId, operation) => {
        setRooms((prevRooms) =>
            prevRooms.map((room) => {
                if (room.id === roomId) {
                    const newValue = operation === "increment" ? room.adults + 1 : room.adults - 1;
                    if (newValue < 1 || newValue > 5) return room;
                    return { ...room, adults: newValue };
                }
                return room;
            })
        );
    };

    const addChild = (roomId) => {
        setRooms((prevRooms) =>
            prevRooms.map((room) => {
                if (room.id === roomId) {
                    if (room.children.length >= 4) return room;
                    return { ...room, children: [...room.children, { id: Date.now(), age: 1 }] };
                }
                return room;
            })
        );
    };

    const removeChild = (roomId, childId) => {
        setRooms((prevRooms) =>
            prevRooms.map((room) => {
                if (room.id === roomId) {
                    return { ...room, children: room.children.filter(child => child.id !== childId) };
                }
                return room;
            })
        );
    };

    const updateChildAge = (roomId, childId, age) => {
        const ageNum = parseInt(age);
        if (ageNum < 1 || ageNum > 11) return;

        setRooms((prevRooms) =>
            prevRooms.map((room) => {
                if (room.id === roomId) {
                    return {
                        ...room,
                        children: room.children.map(child =>
                            child.id === childId ? { ...child, age: ageNum } : child
                        )
                    };
                }
                return room;
            })
        );
    };

    const addRoom = () => {
        const newId = Math.max(...rooms.map(r => r.id)) + 1;
        setRooms([...rooms, { id: newId, adults: 2, children: [], babies: 0 }]);
    };

    const removeRoom = (roomId) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter(room => room.id !== roomId));
        }
    };

    // Validation helper functions
    const validateSearch = () => {
        // Validate location selection
        if (!selectedCity && !selectedHotel) {
            toast.error("Veuillez sélectionner une ville ou un hôtel", {
                duration: 4000,
                position: 'top-center',
            });
            return false;
        }

        // Validate dates
        if (!range.from || !range.to) {
            toast.error("Veuillez sélectionner les dates de séjour", {
                duration: 4000,
                position: 'top-center',
            });
            return false;
        }

        // Check if check-in is before check-out
        if (range.from >= range.to) {
            toast.error("La date de départ doit être après la date d'arrivée", {
                duration: 4000,
                position: 'top-center',
            });
            return false;
        }

        // Check if dates are in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (range.from < today) {
            toast.error("La date d'arrivée ne peut pas être dans le passé", {
                duration: 4000,
                position: 'top-center',
            });
            return false;
        }

        // Validate rooms
        if (rooms.length === 0) {
            toast.error("Veuillez configurer au moins une chambre", {
                duration: 4000,
                position: 'top-center',
            });
            return false;
        }

        return true;
    };

    const formatDateForAPI = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Search handler
    const handleSearch = () => {
        // Validate inputs
        if (!validateSearch()) {
            return;
        }

        // Format dates for API (YYYY-MM-DD)
        const checkInFormatted = formatDateForAPI(range.from);
        const checkOutFormatted = formatDateForAPI(range.to);

        // Build search params object
        const searchParams = new URLSearchParams();

        // Add selection type and location info
        searchParams.append('selectionType', selectionType);

        if (selectionType === 'city') {
            searchParams.append('cityId', selectedCity.Id);
            searchParams.append('cityName', selectedCity.Name);
            if (selectedCity.Country?.Name) {
                searchParams.append('countryName', selectedCity.Country.Name);
            }
        } else if (selectionType === 'hotel') {
            searchParams.append('hotelId', selectedHotel.Id);
            searchParams.append('hotelName', selectedHotel.Name);
            if (selectedHotel.City?.Id) {
                searchParams.append('cityId', selectedHotel.City.Id);
            }
            if (selectedHotel.City?.Name) {
                searchParams.append('cityName', selectedHotel.City.Name);
            }
        }

        // Add dates
        searchParams.append('checkIn', checkInFormatted);
        searchParams.append('checkOut', checkOutFormatted);

        // Add rooms data as JSON string
        const roomsData = rooms.map(room => ({
            adults: room.adults,
            children: room.children.map(child => child.age)
        }));
        searchParams.append('rooms', JSON.stringify(roomsData));

        // Add number of nights for display
        searchParams.append('nights', calculateNights());

        // Development logging
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Search Params:', {
                selectionType,
                cityId: selectedCity?.Id,
                hotelId: selectedHotel?.Id,
                checkIn: checkInFormatted,
                checkOut: checkOutFormatted,
                rooms: roomsData,
                nights: calculateNights()
            });
        }

        // Show loading toast
        toast.loading("Recherche en cours...", {
            id: 'search-loading',
            duration: 2000,
        });

        // Navigate to search results page
        navigate(`/search-results?${searchParams.toString()}`);
    };

    // Calendar functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const isDateInRange = (day) => {
        if (!range.from || !range.to || !day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date >= range.from && date <= range.to;
    };

    const isDateSelected = (day) => {
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return isSameDay(date, range.from) || isSameDay(date, range.to);
    };

    const isDateDisabled = (day) => {
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleDateClick = (day) => {
        if (!day || isDateDisabled(day)) return;

        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        clickedDate.setHours(0, 0, 0, 0);

        if (!range.from || (range.from && range.to)) {
            setRange({ from: clickedDate, to: null });
        } else {
            if (clickedDate < range.from) {
                setRange({ from: clickedDate, to: range.from });
            } else {
                setRange({ from: range.from, to: clickedDate });
            }
        }
    };

    const changeMonth = (offset) => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
        );
    };

    const isToday = (day) => {
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const today = new Date();
        return isSameDay(date, today);
    };

    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    const { adults, children } = getTotalGuests();

    return (
        <div className="w-full max-w-7xl mx-auto -mt-16 z-10 px-4 py-8">
            <div className="bg-white rounded-xl custom-shadow-heavy p-4 md:p-6 bg-linear-to-r from-slate-200 via-white to-slate-200">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Location Input with Autocomplete (Cities + Hotels) */}
                    <div className="flex-1 min-w-[220px] relative" ref={cityDropdownRef}>
                        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white">
                            <MdLocationOn className="text-sky-600" size={22} />
                            <input
                                ref={locationInputRef}
                                type="text"
                                placeholder="Ville ou hôtel..."
                                value={location}
                                onChange={handleLocationChange}
                                onKeyDown={handleLocationKeyDown}
                                onFocus={() => setShowCityDropdown(true)}
                                className="flex-1 outline-none text-gray-800 text-sm placeholder-gray-500"
                                autoComplete="off"
                            />
                            {location && (
                                <button
                                    onClick={handleClearLocation}
                                    className="text-gray-400 hover:text-gray-700"
                                >
                                    <MdClose size={20} />
                                </button>
                            )}
                        </div>

                        {/* City & Hotel Dropdown - Enhanced Modern Design */}
                        {showCityDropdown && location && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 max-h-[400px] overflow-hidden animate-slideDown">
                                {/* Loading State */}
                                {(citiesLoading || hotelsLoading) && (
                                    <div className="p-6 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="relative w-10 h-10">
                                                <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">
                                                Recherche...
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {(citiesError || hotelsError) && (
                                    <div className="p-6 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-red-600 mb-1">
                                                    Erreur de chargement
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Impossible de charger les données
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!citiesLoading && !hotelsLoading && !citiesError && !hotelsError && combinedResults.length === 0 && (
                                    <div className="p-6 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                                <MdLocationOn className="text-gray-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                                    Aucun résultat trouvé
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Essayez avec un autre nom
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Combined Results List */}
                                {!citiesLoading && !hotelsLoading && !citiesError && !hotelsError && combinedResults.length > 0 && (
                                    <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                                        {/* Results count */}
                                        <div className="sticky top-0 bg-gradient-to-b from-gray-50 to-transparent px-4 py-2 border-b border-gray-100 z-10">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {filteredResults.cities.length} {filteredResults.cities.length === 1 ? 'ville' : 'villes'} · {filteredResults.hotels.length} {filteredResults.hotels.length === 1 ? 'hôtel' : 'hôtels'}
                                            </p>
                                        </div>

                                        <ul className="py-1">
                                            {combinedResults.map((result, index) => {
                                                const isCity = result.type === 'city';
                                                const isHighlighted = highlightedIndex === index;

                                                if (isCity) {
                                                    // CITY ITEM
                                                    const city = result.data;
                                                    const cityName = city.Name || '';
                                                    const countryName = city.Country?.Name || '';
                                                    const regionName = city.Region || '';

                                                    return (
                                                        <li
                                                            key={`city-${city.Id}`}
                                                            data-index={index}
                                                            onClick={() => handleCitySelect(city)}
                                                            className={`
                                                                px-4 py-3 cursor-pointer transition-all duration-200 
                                                                border-l-4 mx-2 rounded-lg my-1
                                                                ${isHighlighted
                                                                ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-500 shadow-sm scale-[1.02]'
                                                                : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                                                            }
                                                            `}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`
                                                                    mt-0.5 p-2 rounded-lg transition-all duration-200
                                                                    ${isHighlighted ? 'bg-sky-100 scale-110' : 'bg-gray-100'}
                                                                `}>
                                                                    <MdLocationOn
                                                                        className={`transition-colors duration-200 ${
                                                                            isHighlighted ? 'text-sky-600' : 'text-gray-400'
                                                                        }`}
                                                                        size={20}
                                                                    />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <div className={`
                                                                            font-semibold text-sm transition-colors duration-200
                                                                            ${isHighlighted ? 'text-sky-700' : 'text-gray-800'}
                                                                        `}>
                                                                            {cityName}
                                                                        </div>
                                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                            Ville
                                                                        </span>
                                                                    </div>

                                                                    {regionName && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            </svg>
                                                                            <span className="truncate">{regionName}</span>
                                                                        </div>
                                                                    )}

                                                                    {countryName && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                                                            </svg>
                                                                            <span className="truncate">{countryName}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {isHighlighted && (
                                                                    <div className="mt-1 text-sky-600 animate-pulse">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                } else {
                                                    // HOTEL ITEM
                                                    const hotel = result.data;
                                                    const hotelName = hotel.Name || '';
                                                    const cityName = hotel.City?.Name || '';
                                                    const category = hotel.Category?.Star ? `${hotel.Category.Star} étoiles` : '';

                                                    return (
                                                        <li
                                                            key={`hotel-${hotel.Id}`}
                                                            data-index={index}
                                                            onClick={() => handleHotelSelect(hotel)}
                                                            className={`
                                                                px-4 py-3 cursor-pointer transition-all duration-200 
                                                                border-l-4 mx-2 rounded-lg my-1
                                                                ${isHighlighted
                                                                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500 shadow-sm scale-[1.02]'
                                                                : 'border-transparent hover:bg-gray-50 hover:border-gray-300'
                                                            }
                                                            `}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`
                                                                    mt-0.5 p-2 rounded-lg transition-all duration-200
                                                                    ${isHighlighted ? 'bg-amber-100 scale-110' : 'bg-gray-100'}
                                                                `}>
                                                                    <FaHotel
                                                                        className={`transition-colors duration-200 ${
                                                                            isHighlighted ? 'text-amber-600' : 'text-gray-400'
                                                                        }`}
                                                                        size={18}
                                                                    />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <div className={`
                                                                            font-semibold text-sm transition-colors duration-200
                                                                            ${isHighlighted ? 'text-amber-700' : 'text-gray-800'}
                                                                        `}>
                                                                            {hotelName}
                                                                        </div>
                                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                                            Hôtel
                                                                        </span>
                                                                    </div>

                                                                    {category && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-0.5">
                                                                            <span>⭐ {category}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                        <MdLocationOn size={12} />
                                                                        <span className="truncate">{cityName}</span>
                                                                    </div>
                                                                </div>

                                                                {isHighlighted && (
                                                                    <div className="mt-1 text-amber-600 animate-pulse">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                }
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Picker */}
                    <div className="flex-1 min-w-[260px] relative" ref={datePickerRef}>
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="w-full flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white"
                        >
                            <BsCalendar3 className="text-sky-600" size={20}/>
                            <div className="flex-1 text-left text-sm">
                                <span className="text-gray-800">
                                  {range.from ? formatDate(range.from) : "Check-in"}
                                </span>
                                <span className="mx-1 text-gray-400">-</span>
                                <span className="text-gray-800">
                                  {range.to ? formatDate(range.to) : "Check-out"}
                                </span>
                            </div>
                            {range.from && range.to && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {calculateNights()} nuit{calculateNights() > 1 ? "s" : ""}
                                </span>
                            )}
                        </button>

                        {showDatePicker && (
                            <div
                                className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-gray-200"
                                style={{minWidth: "380px"}}
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => changeMonth(-1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="text-xl text-gray-600">‹</span>
                                        </button>
                                        <h3 className="text-base font-semibold text-gray-800">
                                            {monthNames[currentMonth.getMonth()]}{" "}
                                            {currentMonth.getFullYear()}
                                        </h3>
                                        <button
                                            onClick={() => changeMonth(1)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <span className="text-xl text-gray-600">›</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"].map(
                                            (day, idx) => (
                                                <div
                                                    key={idx}
                                                    className="h-10 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase"
                                                >
                                                    {day}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {weeks.map((week, weekIdx) =>
                                            week.map((day, dayIdx) => {
                                                const isSelected = isDateSelected(day);
                                                const inRange = isDateInRange(day);
                                                const disabled = isDateDisabled(day);
                                                const todayDate = isToday(day);

                                                return (
                                                    <button
                                                        key={`${weekIdx}-${dayIdx}`}
                                                        onClick={() => handleDateClick(day)}
                                                        disabled={!day || disabled}
                                                        className={`
                                                            h-11 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                                            ${!day ? "invisible" : ""}
                                                            ${disabled ? "text-gray-300 cursor-not-allowed bg-gray-50" : ""}
                                                            ${isSelected ? "bg-sky-600 text-white font-bold shadow-md" : ""}
                                                            ${inRange && !isSelected ? "bg-sky-50 text-sky-600 font-semibold" : ""}
                                                            ${todayDate && !isSelected && !inRange ? "border-2 border-sky-600 text-sky-600 font-bold" : ""}
                                                            ${!disabled && !isSelected && !inRange && !todayDate ? "hover:bg-sky-50 hover:text-sky-600 text-gray-700" : ""}
                                                        `}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Guest Picker */}
                    <div className="flex-1 min-w-[260px] relative" ref={guestPickerRef}>
                        <button
                            onClick={() => setShowGuestPicker(!showGuestPicker)}
                            className="w-full flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white"
                        >
                            <HiUsers className="text-sky-600" size={22}/>
                            <span className="text-gray-800 text-sm truncate">
                                {rooms.length} chambre{rooms.length > 1 ? "s" : ""}, {adults} adulte{adults > 1 ? "s" : ""}{children > 0 && `, ${children} enfant${children > 1 ? "s" : ""}`}
                            </span>
                        </button>

                        {showGuestPicker && (
                            <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 w-80 md:w-96 max-h-[550px] overflow-y-auto">
                                <div className="p-5">
                                    {rooms.map((room, index) => (
                                        <div key={room.id} className="mb-5 pb-5 border-b border-gray-200 last:border-b-0">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-gray-800 font-semibold text-base">
                                                    Chambre {index + 1}
                                                </h3>
                                                {rooms.length > 1 && (
                                                    <button
                                                        onClick={() => removeRoom(room.id)}
                                                        className="text-sky-600 hover:text-red-600 p-1 rounded-full hover:bg-sky-50 transition-colors"
                                                    >
                                                        <IoTrashOutline size={20} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Adults */}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-gray-700 text-sm font-medium">Adulte(s)</span>
                                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => updateRoomAdults(room.id, "decrement")}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-300"
                                                        disabled={room.adults <= 1}
                                                    >
                                                        <span className="text-gray-600 text-lg">−</span>
                                                    </button>
                                                    <span className="text-gray-800 font-medium w-12 text-center">
                                                        {room.adults}
                                                    </span>
                                                    <button
                                                        onClick={() => updateRoomAdults(room.id, "increment")}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-l border-gray-300"
                                                        disabled={room.adults >= 5}
                                                    >
                                                        <span className="text-gray-600 text-lg">+</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Children */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-gray-700 text-sm font-medium">Enfant(s)</span>
                                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => {
                                                                if (room.children.length > 0) {
                                                                    removeChild(room.id, room.children[room.children.length - 1].id);
                                                                }
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-300"
                                                            disabled={room.children.length === 0}
                                                        >
                                                            <span className="text-gray-600 text-lg">−</span>
                                                        </button>
                                                        <span className="text-gray-800 font-medium w-12 text-center">
                                                            {room.children.length}
                                                        </span>
                                                        <button
                                                            onClick={() => addChild(room.id)}
                                                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-l border-gray-300"
                                                            disabled={room.children.length >= 4}
                                                        >
                                                            <span className="text-gray-600 text-lg">+</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Children Age Selects */}
                                                {room.children.length > 0 && (
                                                    <div className="space-y-2">
                                                        {room.children.map((child, childIndex) => (
                                                            <div key={child.id} className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-600 w-20">
                                                                    Enfant {childIndex + 1}
                                                                </span>
                                                                <select
                                                                    value={child.age}
                                                                    onChange={(e) => updateChildAge(room.id, child.id, e.target.value)}
                                                                    className="flex-1 px-3 py-2 bg-slate-100 text-zinc-800 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                                                                >
                                                                    {[...Array(11)].map((_, i) => (
                                                                        <option className="text-zinc-800" key={i + 1} value={i + 1}>
                                                                            {i + 1} an{i + 1 > 1 ? 's' : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    onClick={() => removeChild(room.id, child.id)}
                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                >
                                                                    <IoMdClose size={20} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Room Button */}
                                    <button
                                        onClick={addRoom}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-sky-300 rounded-lg text-sky-600 hover:bg-sky-50 hover:border-sky-500 transition-colors font-medium"
                                    >
                                        <IoAddOutline size={20} />
                                        Ajouter une chambre
                                    </button>

                                    {/* Done Button */}
                                    <button
                                        onClick={() => setShowGuestPicker(false)}
                                        className="w-full mt-4 bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 transition-colors font-semibold flex items-center justify-center gap-2"
                                    >
                                        <IoCheckmark size={22} />
                                        Terminé
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Button */}
                    <Button
                        onClick={handleSearch}
                        className="w-full lg:w-auto bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors font-semibold"
                    >
                        <span className="flex justify-center items-center gap-2 px-4">
                            <BsSearch size={20} />
                            Rechercher
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default BookingHotels;
