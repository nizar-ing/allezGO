import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    MapPin,
    Star,
    Wifi,
    Coffee,
    Waves,
    Car,
    Dumbbell,
    Utensils,
    ChevronLeft,
    X,
    Tag,
    Users,
    Eye,
    Building2,
    Info,
    Wind,
    Sparkles,
    UtensilsCrossed,
    Shield,
    Clock,
    Award,
    Navigation,
    Mountain,
    Home,
    Receipt,
    CheckCircle2,
    Calendar,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";

function HotelDetails() {
    const params = useParams();
    const hotelId = params.hotelId || params.id;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState("overview");
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [mainImageIndex, setMainImageIndex] = useState(0);

    // Booking State
    const [selectedBoarding, setSelectedBoarding] = useState("BB"); // Default: Petit Déjeuner
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [rooms, setRooms] = useState([
        { adults: 2, children: 0, selectedRoomType: "" }
    ]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [isSearchingRooms, setIsSearchingRooms] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Initialize dates from URL params or set defaults
    useEffect(() => {
        const checkin = searchParams.get("checkin");
        const checkout = searchParams.get("checkout");
        const roomsParam = searchParams.get("rooms");

        if (checkin) setCheckInDate(checkin);
        else setCheckInDate(getDefaultCheckIn());

        if (checkout) setCheckOutDate(checkout);
        else setCheckOutDate(getDefaultCheckOut());

        if (roomsParam) {
            try {
                const parsedRooms = JSON.parse(decodeURIComponent(roomsParam));
                setRooms(parsedRooms.map(r => ({
                    adults: r.adults || 2,
                    children: r.children || 0,
                    selectedRoomType: ""
                })));
            } catch (e) {
                console.error("Error parsing rooms:", e);
            }
        }
    }, []);

    // Helper functions for default dates
    const getDefaultCheckIn = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
    };

    const getDefaultCheckOut = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        return tomorrow.toISOString().split('T')[0];
    };

    // Fetch hotel details
    const {
        data: hotelData,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["hotelDetail", hotelId],
        queryFn: async () => {
            const response = await apiClient.getHotelDetail(Number(hotelId));
            if (response.errorMessage && response.errorMessage.length > 0) {
                throw new Error(response.errorMessage.join(", "));
            }
            return response.hotelDetail;
        },
        enabled: !!hotelId && !isNaN(Number(hotelId)),
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // Search for available rooms and prices
    const handleSearchRooms = async () => {
        if (!checkInDate || !checkOutDate) {
            toast.error("Veuillez sélectionner les dates de séjour");
            return;
        }

        if (new Date(checkInDate) >= new Date(checkOutDate)) {
            toast.error("La date de départ doit être après la date d'arrivée");
            return;
        }

        setIsSearchingRooms(true);
        setHasSearched(false);

        try {
            // Call API to get room availability and prices
            const response = await apiClient.searchRoomAvailability({
                hotelId: Number(hotelId),
                checkIn: checkInDate,
                checkOut: checkOutDate,
                rooms: rooms.map(r => ({
                    adults: r.adults,
                    children: r.children
                })),
                boardingType: selectedBoarding
            });

            if (response.errorMessage && response.errorMessage.length > 0) {
                toast.error(response.errorMessage.join(", "));
                setAvailableRooms([]);
            } else {
                setAvailableRooms(response.rooms || []);
                setHasSearched(true);
                if (response.rooms && response.rooms.length > 0) {
                    toast.success(`${response.rooms.length} option(s) de chambre disponible(s)!`);
                } else {
                    toast.error("Aucune chambre disponible pour ces critères");
                }
            }
        } catch (error) {
            console.error("Room search error:", error);
            toast.error("Erreur lors de la recherche de chambres");
            setAvailableRooms([]);
            setHasSearched(true);
        } finally {
            setIsSearchingRooms(false);
        }
    };

    // Calculate total price when room selections change
    useEffect(() => {
        let total = 0;
        rooms.forEach((room) => {
            if (room.selectedRoomType) {
                const selectedRoom = availableRooms.find(r => r.id === room.selectedRoomType);
                if (selectedRoom) {
                    total += selectedRoom.price;
                }
            }
        });
        setTotalPrice(total);
    }, [rooms, availableRooms]);

    // Add/Remove rooms
    const addRoom = () => {
        if (rooms.length < 5) {
            setRooms([...rooms, { adults: 2, children: 0, selectedRoomType: "" }]);
        } else {
            toast.error("Maximum 5 chambres par réservation");
        }
    };

    const removeRoom = (index) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter((_, i) => i !== index));
        } else {
            toast.error("Au moins une chambre est requise");
        }
    };

    // Update room configuration
    const updateRoom = (index, field, value) => {
        const updatedRooms = [...rooms];
        updatedRooms[index][field] = value;
        setRooms(updatedRooms);
    };

    // Handle reservation
    const handleReserve = () => {
        // Validate all rooms have selections
        const allRoomsSelected = rooms.every(room => room.selectedRoomType);

        if (!allRoomsSelected) {
            toast.error("Veuillez sélectionner un type de chambre pour chaque chambre");
            return;
        }

        if (totalPrice === 0) {
            toast.error("Veuillez rechercher les disponibilités d'abord");
            return;
        }

        // Prepare booking data
        const bookingData = {
            hotelId: Number(hotelId),
            hotelName: hotelData?.Name,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            boardingType: selectedBoarding,
            rooms: rooms.map((room) => {
                const selectedRoom = availableRooms.find(r => r.id === room.selectedRoomType);
                return {
                    roomType: selectedRoom?.name,
                    roomId: selectedRoom?.id,
                    adults: room.adults,
                    children: room.children,
                    price: selectedRoom?.price
                };
            }),
            totalPrice: totalPrice,
            currency: "DZD"
        };

        // Navigate to booking/payment page
        navigate(`/booking/${hotelId}`, {
            state: { bookingData, hotel: hotelData }
        });
        toast.success("Redirection vers la réservation...");
    };

    // Missing hotelId
    if (!hotelId) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        URL Invalide
                    </h2>
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

    // Loading state
    if (isLoading) {
        return (
            <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="h-[500px] bg-gray-200 rounded-2xl mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
                            <div className="h-96 bg-gray-200 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Error state
    if (isError || !hotelData) {
        toast.error(error?.message || "Échec du chargement des détails de l'hôtel");
        return (
            <section className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        Hôtel Non Trouvé
                    </h2>
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

    const {
        Name,
        Category,
        City,
        Email,
        Phone: HotelPhone,
        Vues,
        Type,
        Image,
        Album,
        Tag: Tags,
        Boarding,
        Theme,
    } = hotelData;

    // Use Image property as main image, then add Album images
    const allImages = Image
        ? [{ Url: Image, Alt: Name }, ...(Album || [])]
        : (Album || []);

    const tabs = [
        { id: "overview", label: "Aperçu", icon: Info },
        { id: "location", label: "Localisation", icon: MapPin },
        { id: "gallery", label: "Galerie", icon: Eye },
        { id: "amenities", label: "Équipements", icon: Building2 },
    ];

    // Enhanced amenities with French labels
    const commonAmenities = [
        { icon: Wifi, label: "WiFi Gratuit" },
        { icon: Waves, label: "Piscine" },
        { icon: Car, label: "Parking Gratuit" },
        { icon: Dumbbell, label: "Salle de Sport" },
        { icon: UtensilsCrossed, label: "Restaurant" },
        { icon: Utensils, label: "Service en Chambre" },
        { icon: Wind, label: "Climatisation" },
        { icon: Sparkles, label: "Spa & Wellness" },
        { icon: Coffee, label: "Bar & Lounge" },
        { icon: Shield, label: "Sécurité 24/7" },
    ];

    // Get boarding type label
    const getBoardingLabel = (code) => {
        const boarding = Boarding?.find(b => b.Code === code);
        return boarding?.Name || code;
    };

    return (
        <section className="min-h-screen w-8/9 mx-auto bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
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
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                            }}
                            disabled={selectedImageIndex === 0}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-50"
                        >
                            Précédent
                        </button>
                        <span className="px-4 py-2 bg-white/20 text-white rounded-lg">
                            {selectedImageIndex + 1} / {allImages.length}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex(Math.min(allImages.length - 1, selectedImageIndex + 1));
                            }}
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
                        src={allImages[mainImageIndex]?.Url || Image}
                        alt={allImages[mainImageIndex]?.Alt || Name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                    {/* Hotel Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    {Category?.Star && (
                                        <div className="flex items-center gap-1 bg-orange-500 px-4 py-2 rounded-full shadow-lg">
                                            {[...Array(Category.Star)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    fill="currentColor"
                                                    className="text-white"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {Type && (
                                        <span className="bg-sky-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                                            {Type}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-2xl">
                                    {Name}
                                </h1>
                                <div className="flex items-center gap-2 text-base sm:text-lg">
                                    <MapPin size={22} className="flex-shrink-0" />
                                    <span className="font-medium">
                                        {City?.Name}, {City?.Country}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Navigation Dots */}
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

                    {Vues && Vues.length > 0 && (
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
                            {Theme?.map((theme, index) => (
                                <span
                                    key={`theme-${index}`}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-full shadow-md border-2 border-orange-200 text-orange-700 font-semibold hover:shadow-lg transition-all hover:scale-105"
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

                    {/* Left Content Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <>
                                {/* Hotel Description Card */}
                                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                        <Info className="text-sky-600" size={32} />
                                        À Propos de {Name}
                                    </h2>

                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 leading-relaxed text-lg mb-6">
                                            Découvrez {Name}, un {Type?.toLowerCase()} exceptionnel situé à {City?.Name}, {City?.Country}.
                                            Classé {Category?.Title}, cet établissement offre une expérience unique avec {Vues?.length > 0 ? `une magnifique ${Vues[0].toLowerCase()}` : 'des vues imprenantes'}.
                                        </p>

                                        {Theme?.length > 0 && (
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                Parfait pour {Theme.map((t, i) => (
                                                <span key={i}>
                                                        {i > 0 && (i === Theme.length - 1 ? ' et ' : ', ')}
                                                    <strong className="text-sky-700">{t.toLowerCase()}</strong>
                                                    </span>
                                            ))}, cet hôtel répond à tous vos besoins de confort et de détente.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Boarding Options */}
                                {Boarding && Boarding.length > 0 && (
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
                                                    <p className="font-bold text-gray-800 text-xl mb-2">
                                                        {board.Name}
                                                    </p>
                                                    {board.Description && (
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {board.Description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 bg-sky-50 rounded-xl border-l-4 border-sky-600">
                                            <p className="text-sm text-gray-700">
                                                <strong>💡 Conseil :</strong> Les formules de pension peuvent varier selon la saison. Contactez-nous pour plus d'informations sur les tarifs actuels.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Why Book Direct */}
                                <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl shadow-xl p-6 md:p-8 text-white">
                                    <h3 className="font-bold mb-6 text-2xl flex items-center gap-3">
                                        <Award size={28} />
                                        Avantages de la Réservation Directe
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                            <Award className="flex-shrink-0 mt-1" size={24} />
                                            <div>
                                                <h4 className="font-bold mb-1">Meilleur Prix Garanti</h4>
                                                <p className="text-sm text-sky-100">Nous garantissons le meilleur tarif du marché</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                            <Clock className="flex-shrink-0 mt-1" size={24} />
                                            <div>
                                                <h4 className="font-bold mb-1">Annulation Flexible</h4>
                                                <p className="text-sm text-sky-100">Modifiez ou annulez facilement</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                            <Sparkles className="flex-shrink-0 mt-1" size={24} />
                                            <div>
                                                <h4 className="font-bold mb-1">Privilèges Exclusifs</h4>
                                                <p className="text-sm text-sky-100">Surclassement et services premium</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                            <Shield className="flex-shrink-0 mt-1" size={24} />
                                            <div>
                                                <h4 className="font-bold mb-1">Support 24/7</h4>
                                                <p className="text-sm text-sky-100">Assistance disponible à tout moment</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Location Tab */}
                        {activeTab === "location" && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                                    <Navigation className="text-sky-600" size={32} />
                                    Localisation & Accès
                                </h2>

                                {/* Location Details */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200">
                                        <div className="flex items-start gap-4">
                                            <MapPin className="text-sky-600 flex-shrink-0" size={32} />
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-xl mb-2">Adresse</h3>
                                                <p className="text-gray-700 text-lg leading-relaxed">
                                                    {Name}<br />
                                                    {City?.Name}, {City?.Country}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {Vues && Vues.length > 0 && (
                                        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                                            <div className="flex items-start gap-4">
                                                <Eye className="text-orange-600 flex-shrink-0" size={32} />
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-xl mb-3">Points de Vue</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Vues.map((vue, index) => (
                                                            <span key={index} className="px-4 py-2 bg-white rounded-full text-orange-700 font-semibold shadow-sm">
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
                                                <Car size={20} className="text-sky-600" />
                                                Accès en Voiture
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                Parking gratuit disponible. GPS : {City?.Name}, {City?.Country}
                                            </p>
                                        </div>

                                        <div className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <Navigation size={20} className="text-sky-600" />
                                                À Proximité
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                Centre-ville, plages, sites touristiques accessibles
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gallery Tab */}
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
                                                key={index}
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
                                                    <Eye
                                                        size={40}
                                                        className="text-white transform scale-75 group-hover:scale-100 transition-transform"
                                                    />
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

                        {/* Amenities Tab */}
                        {activeTab === "amenities" && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                                    <Building2 className="text-sky-600" size={32} />
                                    Équipements & Services Premium
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    {commonAmenities.map((amenity, index) => {
                                        const Icon = amenity.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-5 bg-gradient-to-br from-sky-50 to-white border-2 border-sky-100 rounded-xl hover:shadow-lg hover:border-sky-300 hover:scale-105 transition-all"
                                            >
                                                <div className="p-3 bg-sky-100 rounded-full">
                                                    <Icon className="text-sky-600 flex-shrink-0" size={24} />
                                                </div>
                                                <span className="font-semibold text-gray-700 text-lg">
                                                    {amenity.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Additional Services */}
                                <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-l-4 border-orange-500">
                                    <h3 className="font-bold text-gray-800 mb-4 text-xl">Services Supplémentaires</h3>
                                    <ul className="space-y-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-orange-600" />
                                            <span>Conciergerie disponible 24h/24</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-orange-600" />
                                            <span>Service de blanchisserie</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-orange-600" />
                                            <span>Transfert aéroport (sur demande)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-orange-600" />
                                            <span>Organisation d'excursions</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - ENHANCED BOOKING CARD */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 lg:sticky lg:top-6 space-y-6">

                            {/* HEADER */}
                            <div className="border-b-2 border-sky-100 pb-4">
                                <h3 className="text-2xl font-bold text-sky-700 flex items-center gap-2">
                                    <Receipt size={28} />
                                    Chambres & Tarifs
                                </h3>
                            </div>

                            {/* DATE AND ROOM INFO */}
                            <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-lg border-2 border-sky-200">
                                <div className="flex items-center gap-3 text-sm text-gray-700 mb-3">
                                    <Calendar className="text-sky-600" size={18} />
                                    <span className="font-medium">
                                        {checkInDate && checkOutDate
                                            ? `${new Date(checkInDate).toLocaleDateString('fr-FR')} - ${new Date(checkOutDate).toLocaleDateString('fr-FR')}`
                                            : 'Sélectionnez les dates'
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Users className="text-sky-600" size={18} />
                                    <span className="font-medium">
                                        {rooms.length} chambre{rooms.length > 1 ? 's' : ''}: {rooms.reduce((acc, r) => acc + r.adults, 0)} adulte{rooms.reduce((acc, r) => acc + r.adults, 0) > 1 ? 's' : ''} et {rooms.reduce((acc, r) => acc + r.children, 0)} enfant{rooms.reduce((acc, r) => acc + r.children, 0) > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* DATE SELECTION */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                            Arrivée
                                        </label>
                                        <input
                                            type="date"
                                            value={checkInDate}
                                            onChange={(e) => {
                                                setCheckInDate(e.target.value);
                                                setHasSearched(false);
                                                setAvailableRooms([]);
                                            }}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                            Départ
                                        </label>
                                        <input
                                            type="date"
                                            value={checkOutDate}
                                            onChange={(e) => {
                                                setCheckOutDate(e.target.value);
                                                setHasSearched(false);
                                                setAvailableRooms([]);
                                            }}
                                            min={checkInDate || new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* ROOM CONFIGURATION */}
                                <div className="bg-sky-50 p-4 rounded-lg border-2 border-sky-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Users size={18} className="text-sky-600" />
                                            Configuration
                                        </label>
                                        {rooms.length < 5 && (
                                            <button
                                                onClick={() => {
                                                    addRoom();
                                                    setHasSearched(false);
                                                    setAvailableRooms([]);
                                                }}
                                                className="text-xs bg-sky-600 text-white px-3 py-1 rounded-full hover:bg-sky-700 transition-colors font-semibold"
                                            >
                                                + Chambre
                                            </button>
                                        )}
                                    </div>

                                    {rooms.map((room, index) => (
                                        <div key={index} className="bg-white p-3 rounded-lg mb-2 border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-sky-700">Chambre {index + 1}</span>
                                                {rooms.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            removeRoom(index);
                                                            setHasSearched(false);
                                                            setAvailableRooms([]);
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-gray-600">Adultes</label>
                                                    <select
                                                        value={room.adults}
                                                        onChange={(e) => {
                                                            updateRoom(index, 'adults', Number(e.target.value));
                                                            setHasSearched(false);
                                                            setAvailableRooms([]);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-sky-500 focus:outline-none"
                                                    >
                                                        {[1, 2, 3, 4].map(n => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-600">Enfants</label>
                                                    <select
                                                        value={room.children}
                                                        onChange={(e) => {
                                                            updateRoom(index, 'children', Number(e.target.value));
                                                            setHasSearched(false);
                                                            setAvailableRooms([]);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-sky-500 focus:outline-none"
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

                                {/* BOARDING TYPE TABS (BEFORE SEARCH) */}
                                {Boarding && Boarding.length > 0 && (
                                    <div className="border-t-2 border-gray-100 pt-4">
                                        <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide">
                                            {Boarding.map((board) => (
                                                <button
                                                    key={board.Id}
                                                    onClick={() => {
                                                        setSelectedBoarding(board.Code);
                                                        setHasSearched(false);
                                                        setAvailableRooms([]);
                                                    }}
                                                    className={`px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                                                        selectedBoarding === board.Code
                                                            ? "bg-white text-gray-900 border-sky-600 shadow-sm"
                                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-transparent"
                                                    }`}
                                                >
                                                    {board.Name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SEARCH BUTTON */}
                                <button
                                    onClick={handleSearchRooms}
                                    disabled={isSearchingRooms || !checkInDate || !checkOutDate}
                                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSearchingRooms ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Recherche...
                                        </>
                                    ) : (
                                        <>
                                            Recherche
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* ROOM SELECTION (AFTER SEARCH) */}
                            {hasSearched && availableRooms.length > 0 && (
                                <div className="border-t-2 border-gray-100 pt-4 space-y-4">
                                    {rooms.map((room, index) => (
                                        <div key={index} className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        Chambre {index + 1}: {room.adults} adulte{room.adults > 1 ? 's' : ''}
                                                    </span>
                                                    <span className="bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full font-semibold">
                                                        Info
                                                    </span>
                                                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold">
                                                        Sur Demande
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <select
                                                    value={room.selectedRoomType}
                                                    onChange={(e) => updateRoom(index, 'selectedRoomType', e.target.value)}
                                                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-sky-500 focus:outline-none font-medium text-sm"
                                                >
                                                    <option value="">Sélectionner une chambre</option>
                                                    {availableRooms.map((roomType) => (
                                                        <option key={roomType.id} value={roomType.id}>
                                                            {roomType.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                {room.selectedRoomType && (
                                                    <div className="text-right">
                                                        <span className="text-lg font-bold text-gray-800">
                                                            {availableRooms.find(r => r.id === room.selectedRoomType)?.price?.toLocaleString()} -
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* TOTAL PRICE */}
                                    <div className="border-t-2 border-gray-200 pt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-semibold text-gray-700">
                                                Montant total du séjour:
                                            </span>
                                            <span className="text-2xl font-bold text-sky-700">
                                                {totalPrice.toLocaleString()} <span className="text-lg">DZD</span>
                                            </span>
                                        </div>

                                        {/* RESERVE BUTTON */}
                                        <button
                                            onClick={handleReserve}
                                            disabled={totalPrice === 0 || !rooms.every(r => r.selectedRoomType)}
                                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                        >
                                            RÉSERVER
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* NO RESULTS MESSAGE */}
                            {hasSearched && availableRooms.length === 0 && (
                                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-semibold text-orange-800 mb-1">
                                            Aucune chambre disponible
                                        </p>
                                        <p className="text-xs text-orange-700">
                                            Aucune chambre n'est disponible pour les dates et critères sélectionnés. Veuillez essayer d'autres dates ou modifier votre recherche.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HotelDetails;
