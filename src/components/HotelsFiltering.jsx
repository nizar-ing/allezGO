import React, { useState } from "react";
import {
    SlidersHorizontal,
    Star,
    Bed,
    UtensilsCrossed,
    Wifi,
    Waves,
    Dumbbell,
    Car,
    Sparkles,
    Users,
    ChevronDown,
    ChevronUp,
    X,
    Filter,
} from "lucide-react";

function HotelsFiltering({ onFilterChange, initialFilters = {} }) {
    // Filter states
    const [filters, setFilters] = useState({
        // Tarifs et disponibilités
        hotelRecommander: initialFilters.hotelRecommander || false,
        tarifEnPromotion: initialFilters.tarifEnPromotion || false,
        disponibleSeulement: initialFilters.disponibleSeulement || false,
        annulationGratuite: initialFilters.annulationGratuite || false,

        // Arrangements
        arrangements: initialFilters.arrangements || [],

        // Catégorie (star rating)
        categories: initialFilters.categories || [],

        // Budget range
        budgetMin: initialFilters.budgetMin || 0,
        budgetMax: initialFilters.budgetMax || 1000,

        // Type de chambres
        roomTypes: initialFilters.roomTypes || [],

        // Services
        services: initialFilters.services || [],
    });

    // Section collapse states
    const [expandedSections, setExpandedSections] = useState({
        tarifs: true,
        arrangements: true,
        categorie: true,
        budget: true,
        chambres: true,
        services: true,
    });

    // Available arrangements from API
    const arrangements = [
        { id: "petit-dejeuner", label: "Petit Déjeuner", count: 4 },
        { id: "demi-pension-plus", label: "Demi Pension Plus", count: 2 },
        { id: "pension-complete-plus", label: "Pension Complète Plus", count: 2 },
        { id: "demi-pension", label: "Demi Pension", count: 5 },
        { id: "all-inclusive", label: "All Inclusive", count: 4 },
        { id: "pension-complete", label: "Pension Complète", count: 2 },
    ];

    // Room types
    const roomTypes = [
        { id: "chambre-triple", label: "Chambre Triple", count: 5 },
        { id: "chambre-double-vue-mer", label: "Chambre Double Vue Mer", count: 5 },
        { id: "chambre-standard", label: "Chambre Standard", count: 4 },
        { id: "chambre-double", label: "Chambre Double", count: 2 },
    ];

    // Services available
    const services = [
        { id: "famille", label: "Famille", count: 5, icon: Users },
        { id: "thalasso-spa", label: "Thalasso & Spa", count: 5, icon: Sparkles },
        { id: "sport-loisirs", label: "Sport & Loisirs", count: 4, icon: Dumbbell },
        { id: "bord-mer", label: "Bord de Mer", count: 5, icon: Waves },
        { id: "tout-inclus", label: "All Inclusive", count: 5, icon: UtensilsCrossed },
        { id: "internet-celibataires", label: "Interdit aux célibataires", count: 2, icon: Users },
        { id: "degustation", label: "Dégustation", count: 2, icon: UtensilsCrossed },
        { id: "interdit-parking", label: "Interdit le parking", count: 2, icon: Car },
        { id: "affaires", label: "Affaires", count: 2, icon: Bed },
        { id: "golf", label: "Golf", count: 1, icon: Dumbbell },
        { id: "luxe", label: "Luxe", count: 1, icon: Star },
    ];

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        let updatedFilters;

        if (filterType === "arrangements" || filterType === "categories" || filterType === "roomTypes" || filterType === "services") {
            // Handle array filters (checkboxes)
            const currentArray = filters[filterType];
            updatedFilters = {
                ...filters,
                [filterType]: currentArray.includes(value)
                    ? currentArray.filter((item) => item !== value)
                    : [...currentArray, value],
            };
        } else {
            // Handle boolean or single value filters
            updatedFilters = {
                ...filters,
                [filterType]: value,
            };
        }

        setFilters(updatedFilters);
        onFilterChange?.(updatedFilters);
    };

    // Reset all filters
    const resetFilters = () => {
        const resetState = {
            hotelRecommander: false,
            tarifEnPromotion: false,
            disponibleSeulement: false,
            annulationGratuite: false,
            arrangements: [],
            categories: [],
            budgetMin: 0,
            budgetMax: 1000,
            roomTypes: [],
            services: [],
        };
        setFilters(resetState);
        onFilterChange?.(resetState);
    };

    // Count active filters
    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.hotelRecommander) count++;
        if (filters.tarifEnPromotion) count++;
        if (filters.disponibleSeulement) count++;
        if (filters.annulationGratuite) count++;
        count += filters.arrangements.length;
        count += filters.categories.length;
        count += filters.roomTypes.length;
        count += filters.services.length;
        if (filters.budgetMin > 0 || filters.budgetMax < 1000) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-sky-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg">
                        <Filter className="text-sky-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Filtrer</h2>
                    {activeFilterCount > 0 && (
                        <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                    >
                        <X size={16} />
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Tarifs et disponibilités Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("tarifs")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Tarifs et disponibilités</span>
                    {expandedSections.tarifs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.tarifs && (
                    <div className="space-y-3 pl-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.hotelRecommander}
                                onChange={(e) => handleFilterChange("hotelRecommander", e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                Hôtel recommander
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">(4)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.tarifEnPromotion}
                                onChange={(e) => handleFilterChange("tarifEnPromotion", e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                Tarifs en promotion
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">(8)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.disponibleSeulement}
                                onChange={(e) => handleFilterChange("disponibleSeulement", e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                Disponible seulement
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">(5)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.annulationGratuite}
                                onChange={(e) => handleFilterChange("annulationGratuite", e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                Annulation Gratuite
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">(6)</span>
                        </label>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Arrangements Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("arrangements")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Arrangements</span>
                    {expandedSections.arrangements ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.arrangements && (
                    <div className="space-y-3 pl-1">
                        {arrangements.map((arrangement) => (
                            <label key={arrangement.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.arrangements.includes(arrangement.id)}
                                    onChange={() => handleFilterChange("arrangements", arrangement.id)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                    {arrangement.label}
                                </span>
                                <span className="text-xs text-gray-400 font-semibold">({arrangement.count})</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Catégorie Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("categorie")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Catégorie</span>
                    {expandedSections.categorie ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.categorie && (
                    <div className="space-y-3 pl-1">
                        {[5, 4, 3].map((stars) => (
                            <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.categories.includes(stars)}
                                    onChange={() => handleFilterChange("categories", stars)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <div className="flex items-center gap-1 flex-1">
                                    {[...Array(stars)].map((_, i) => (
                                        <Star key={i} size={16} fill="#f97316" className="text-orange-500" />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-semibold">
                                    ({stars === 5 ? "1" : stars === 4 ? "5" : "5"})
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Budget Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("budget")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Budget</span>
                    {expandedSections.budget ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.budget && (
                    <div className="space-y-4 pl-1">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Min (DT)</label>
                                <input
                                    type="number"
                                    value={filters.budgetMin}
                                    onChange={(e) => handleFilterChange("budgetMin", Number(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                                    placeholder="139"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Max (DT)</label>
                                <input
                                    type="number"
                                    value={filters.budgetMax}
                                    onChange={(e) => handleFilterChange("budgetMax", Number(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                                    placeholder="588"
                                />
                            </div>
                        </div>

                        {/* Range Display */}
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full">
                                {filters.budgetMin} DT
                            </span>
                            <span className="text-gray-400">—</span>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                                {filters.budgetMax} DT
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Type de chambres Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("chambres")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Type de chambres</span>
                    {expandedSections.chambres ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.chambres && (
                    <div className="space-y-3 pl-1">
                        {roomTypes.map((room) => (
                            <label key={room.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.roomTypes.includes(room.id)}
                                    onChange={() => handleFilterChange("roomTypes", room.id)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                    {room.label}
                                </span>
                                <span className="text-xs text-gray-400 font-semibold">({room.count})</span>
                            </label>
                        ))}
                        <button className="text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors mt-2">
                            Suite <span className="text-orange-500">(suite 3)</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Services Section */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("services")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Service</span>
                    {expandedSections.services ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {expandedSections.services && (
                    <div className="space-y-3 pl-1 max-h-80 overflow-y-auto">
                        {services.map((service) => {
                            const Icon = service.icon;
                            return (
                                <label key={service.id} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.services.includes(service.id)}
                                        onChange={() => handleFilterChange("services", service.id)}
                                        className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                    />
                                    <Icon size={16} className="text-gray-400 group-hover:text-sky-600 transition-colors" />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                        {service.label}
                                    </span>
                                    <span className="text-xs text-gray-400 font-semibold">({service.count})</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Apply Filters Button (Mobile) */}
            <div className="mt-6 pt-4 border-t-2 border-sky-100">
                <button
                    onClick={() => onFilterChange?.(filters)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <SlidersHorizontal size={20} />
                    Appliquer les Filtres
                </button>
            </div>
        </div>
    );
}

export default HotelsFiltering;
