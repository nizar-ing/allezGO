import React, { useState, useRef, useEffect } from "react";
import { MdLocationOn, MdClose } from "react-icons/md";
import { BsCalendar3, BsSearch } from "react-icons/bs";
import { HiUsers } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { IoAddOutline, IoCheckmark, IoTrashOutline } from "react-icons/io5";
import Button from "./Button.jsx";
import { useCities } from "../custom-hooks/useHotelQueries";
import useDebounce from "../custom-hooks/useDebounce";

function BookingHotels() {
    const [location, setLocation] = useState("");
    const [selectedCity, setSelectedCity] = useState(null);
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

    // Fetch cities from API using React Query
    const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
    console.log(cities);
    // Debounce search input for better performance
    const debouncedSearch = useDebounce(location, 300);

    // Intelligent filtering of cities based on input
    const filteredCities = React.useMemo(() => {
        if (!cities || !debouncedSearch) return cities || [];

        const searchLower = debouncedSearch.toLowerCase().trim();

        return cities.filter((city) => {
            const cityName = city.Name?.toLowerCase() || '';
            const countryName = city.Country?.Name?.toLowerCase() || '';
            const regionName = city.Region?.toLowerCase() || '';

            return cityName.includes(searchLower) ||
                countryName.includes(searchLower) ||
                regionName.includes(searchLower);
        }).slice(0, 10);
    }, [cities, debouncedSearch]);

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
        setShowCityDropdown(true);
        setHighlightedIndex(-1);
    };

    // Handle city selection
    const handleCitySelect = (city) => {
        const cityName = city.Name || '';
        const countryName = city.Country?.Name || '';

        setLocation(`${cityName}${countryName ? `, ${countryName}` : ''}`);
        setSelectedCity(city);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    };

    // Clear location
    const handleClearLocation = () => {
        setLocation("");
        setSelectedCity(null);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
        locationInputRef.current?.focus();
    };

    // Keyboard navigation for dropdown
    const handleLocationKeyDown = (e) => {
        if (!showCityDropdown || filteredCities.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredCities.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
                    handleCitySelect(filteredCities[highlightedIndex]);
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

    const handleSearch = () => {
        console.log("Search:", {
            location,
            selectedCity,
            cityId: selectedCity?.Id,
            cityName: selectedCity?.Name,
            countryId: selectedCity?.Country?.Id,
            countryName: selectedCity?.Country?.Name,
            range,
            rooms
        });
        // TODO: Implement search logic with API
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
                    {/* Location Input with Autocomplete */}
                    <div className="flex-1 min-w-[220px] relative" ref={cityDropdownRef}>
                        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white">
                            <MdLocationOn className="text-sky-600" size={22} />
                            <input
                                ref={locationInputRef}
                                type="text"
                                placeholder="Où allez-vous ?"
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

                        {/* City Dropdown */}
                        {showCityDropdown && location && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl z-50 border border-gray-200 max-h-80 overflow-y-auto">
                                {citiesLoading && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                                            Chargement des villes...
                                        </div>
                                    </div>
                                )}

                                {citiesError && (
                                    <div className="p-4 text-center text-red-500 text-sm">
                                        Erreur lors du chargement des villes
                                    </div>
                                )}

                                {!citiesLoading && !citiesError && filteredCities.length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        Aucune ville trouvée
                                    </div>
                                )}

                                {!citiesLoading && !citiesError && filteredCities.length > 0 && (
                                    <ul className="py-2">
                                        {filteredCities.map((city, index) => {
                                            const cityName = city.Name || '';
                                            const countryName = city.Country?.Name || '';
                                            const regionName = city.Region || '';
                                            const cityId = city.Id;

                                            return (
                                                <li
                                                    key={cityId}
                                                    data-index={index}
                                                    onClick={() => handleCitySelect(city)}
                                                    className={`
                                                        px-4 py-3 cursor-pointer transition-colors text-sm
                                                        ${highlightedIndex === index
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <MdLocationOn
                                                            className={highlightedIndex === index ? 'text-sky-600' : 'text-gray-400'}
                                                            size={18}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{cityName}</div>
                                                            {regionName && (
                                                                <div className="text-xs text-gray-500">{regionName}</div>
                                                            )}
                                                            {countryName && (
                                                                <div className="text-xs text-gray-400">{countryName}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
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
                                                    <div className="space-y-2 pl-2">
                                                        {room.children.map((child, childIndex) => (
                                                            <div key={child.id} className="flex items-center justify-between">
                                                                <span className="text-gray-600 text-xs">
                                                                    Enfant {childIndex + 1} âge:
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={child.age}
                                                                        onChange={(e) => updateChildAge(room.id, child.id, e.target.value)}
                                                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-sky-500 bg-white"
                                                                    >
                                                                        {[...Array(11)].map((_, i) => (
                                                                            <option key={i + 1} value={i + 1}>
                                                                                {i + 1} an{i + 1 > 1 ? "s" : ""}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => removeChild(room.id, child.id)}
                                                                        className="text-red-500 hover:text-red-600 p-1"
                                                                    >
                                                                        <IoMdClose size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Room Button */}
                                    <Button
                                        onClick={addRoom}
                                        variant="outline"
                                        size="sm"
                                        className="w-full mb-4"
                                    >
                                        <span className="flex justify-center items-center gap-2">
                                           <IoAddOutline size={20} />
                                            Ajouter chambre
                                        </span>
                                    </Button>

                                    {/* OK Button */}
                                    <Button
                                        onClick={() => setShowGuestPicker(false)}
                                        variant="primary"
                                        className="w-full"
                                    >
                                        <span className="flex justify-center items-center gap-2">
                                            <IoCheckmark size={20} />
                                            Confirmer
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Button */}
                    <Button onClick={handleSearch} variant="primary" className="w-full lg:w-auto">
                        <span className="flex items-center justify-center gap-2">
                            <BsSearch size={18}/>
                            Rechercher
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default BookingHotels;
