import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Users, Moon, ArrowLeft } from "lucide-react";
import HotelsListView from "../ui/HotelsListView.jsx";

/**
 * HotelsSearchResultsPage - Display search results with pricing
 * Focused on search results only
 */
function HotelsSearchResultsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get search data from navigation state
    const {
        searchResults = [],
        searchId = null,
        countResults = 0,
        searchCriteria = null
    } = location.state || {};

    // Redirect if no search results
    if (!searchResults || searchResults.length === 0) {
        navigate('/');
        return null;
    }

    // Extract hotels from search results
    const hotels = searchResults.map(result => result.Hotel);

    // Get tarif for a specific hotel
    const getTarifForHotel = (hotelId) => {
        const result = searchResults.find(r => r.Hotel?.Id === hotelId);
        return result?.Tarif || null;
    };

    // Format date helper
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
        });
    };

    // Search Summary Banner Component
    const SearchSummaryBanner = (
        <div className="bg-white shadow-md mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Nouvelle recherche</span>
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                                Résultats de recherche
                            </h1>
                            <p className="text-gray-600 text-base sm:text-lg">
                                {searchCriteria?.location || "Hôtels disponibles"}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Dates Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-lg border border-sky-100">
                                <Calendar size={18} className="text-sky-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700">
                                    {formatDate(searchCriteria?.checkIn)} - {formatDate(searchCriteria?.checkOut)}
                                </span>
                            </div>

                            {/* Rooms Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
                                <Users size={18} className="text-orange-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700">
                                    {searchCriteria?.rooms?.length || 0} chambre{searchCriteria?.rooms?.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Nights Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                                <Moon size={18} className="text-purple-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700">
                                    {searchCriteria?.nights || 1} nuit{searchCriteria?.nights > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Search ID (optional - for debugging) */}
                    {searchId && (
                        <p className="text-xs text-gray-400 mt-4">
                            ID de recherche: {searchId}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <HotelsListView
            hotels={hotels}
            initialFilters={{}}
            showPricing={true}
            searchCriteria={searchCriteria}
            getTarifForHotel={getTarifForHotel}
            headerContent={SearchSummaryBanner}
            isLoading={false}
            isError={false}
            error={null}
        />
    );
}

export default HotelsSearchResultsPage;
