// src/components/BookingHotels.jsx
import { useState, useTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from "../../ui/Button.jsx";
import LocationSearch from './LocationSearch';
import DateRangePicker from './DateRangePicker';
import GuestRoomSelector from './GuestRoomSelector';
import { formatDateForAPI, calculateNights } from '../../utils/dateHelpers';

function BookingHotels() {
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();

    const [selectedCity,  setSelectedCity]  = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [selectionType, setSelectionType] = useState(null);
    const [range,         setRange]         = useState({ from: null, to: null });
    const [rooms,         setRooms]         = useState([{ id: 1, adults: 2, children: [] }]);

    const handleCitySelect = useCallback((city) => {
        setSelectedCity(city);
        setSelectedHotel(null);
        setSelectionType('city');
    }, []);

    const handleHotelSelect = useCallback((hotel) => {
        setSelectedHotel(hotel);
        setSelectedCity(hotel.City || null);
        setSelectionType('hotel');
    }, []);

    const handleClearLocation = useCallback(() => {
        setSelectedCity(null);
        setSelectedHotel(null);
        setSelectionType(null);
    }, []);

    const validateSearch = useCallback(() => {
        if (!selectedCity && !selectedHotel) {
            toast.error("Veuillez sélectionner une ville ou un hôtel", { duration: 4000, position: 'top-center' });
            return false;
        }
        if (!range.from || !range.to) {
            toast.error("Veuillez sélectionner les dates de séjour", { duration: 4000, position: 'top-center' });
            return false;
        }
        if (range.from >= range.to) {
            toast.error("La date de départ doit être après la date d'arrivée", { duration: 4000, position: 'top-center' });
            return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (range.from < today) {
            toast.error("La date d'arrivée ne peut pas être dans le passé", { duration: 4000, position: 'top-center' });
            return false;
        }
        if (rooms.length === 0) {
            toast.error("Veuillez configurer au moins une chambre", { duration: 4000, position: 'top-center' });
            return false;
        }
        return true;
    }, [selectedCity, selectedHotel, range, rooms.length]);

    const handleSearch = useCallback(() => {
        if (!validateSearch()) return;

        const checkInFormatted  = formatDateForAPI(range.from);
        const checkOutFormatted = formatDateForAPI(range.to);
        const nights            = calculateNights(range.from, range.to);

        const searchParams = new URLSearchParams();
        searchParams.append('selectionType', selectionType);

        if (selectionType === 'city') {
            searchParams.append('cityId',   selectedCity.Id);
            searchParams.append('cityName', selectedCity.Name);
            if (selectedCity.Country?.Name) {
                searchParams.append('countryName', selectedCity.Country.Name);
            }
        } else if (selectionType === 'hotel') {
            searchParams.append('hotelId',   selectedHotel.Id);
            searchParams.append('hotelName', selectedHotel.Name);
            if (selectedHotel.City?.Id)   searchParams.append('cityId',   selectedHotel.City.Id);
            if (selectedHotel.City?.Name) searchParams.append('cityName', selectedHotel.City.Name);
        }

        searchParams.append('checkIn',  checkInFormatted);
        searchParams.append('checkOut', checkOutFormatted);

        // ✅ Fix #1 — children serialized as age numbers (consistent with HotelLightCard)
        const roomsData = rooms.map(room => ({
            adults:   room.adults,
            children: room.children.map(child => child.age), // number[]
        }));

        searchParams.append('rooms',  JSON.stringify(roomsData));
        searchParams.append('nights', nights);

        if (import.meta.env.DEV) {
            console.log('🔍 Search Params:', {
                selectionType,
                cityId:   selectedCity?.Id,
                hotelId:  selectedHotel?.Id,
                checkIn:  checkInFormatted,
                checkOut: checkOutFormatted,
                rooms:    roomsData,
                nights,
            });
        }

        // ✅ Fix #3 — toast.loading OUTSIDE startTransition (it's a side effect)
        toast.loading("Recherche en cours...", { id: 'search-loading', duration: 2000 });

        // ✅ Fix #4 — only navigate() inside startTransition
        startTransition(() => {
            navigate(`/search?${searchParams.toString()}`);
        });

    }, [validateSearch, range, selectionType, selectedCity, selectedHotel, rooms, navigate]);

    return (
        <div className="w-full max-w-7xl mx-auto -mt-16 z-10 px-4 py-8">
            <div className="bg-white rounded-xl custom-shadow-heavy p-4 md:p-6 bg-linear-to-r from-slate-200 via-white to-slate-200">
                <div className="flex flex-wrap gap-3 items-center">

                    <div className="flex-1 min-w-[220px]">
                        <LocationSearch
                            selectedCity={selectedCity}
                            selectedHotel={selectedHotel}
                            onCitySelect={handleCitySelect}
                            onHotelSelect={handleHotelSelect}
                            onClear={handleClearLocation}
                        />
                    </div>

                    <div className="flex-1 min-w-[260px]">
                        <DateRangePicker range={range} setRange={setRange} />
                    </div>

                    <div className="flex-1 min-w-[220px]">
                        <GuestRoomSelector rooms={rooms} setRooms={setRooms} />
                    </div>

                    <Button
                        onClick={handleSearch}
                        disabled={isPending}
                        className="w-full lg:w-auto bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span className="flex justify-center items-center gap-2 px-4">
                            {isPending
                                ? <Loader2 size={20} className="animate-spin" />
                                : <Search size={20} />
                            }
                            {isPending ? 'Recherche...' : 'Rechercher'}
                        </span>
                    </Button>

                </div>
            </div>
        </div>
    );
}

export default BookingHotels;
