import React, {useState, useEffect, useMemo} from "react";
import {NavLink} from "react-router";
import {
    FaHome,
    FaHotel,
    FaTags,
    FaBars,
    FaTimes,
    FaPhone,
    FaPassport,
    FaChevronDown, FaPlane,
} from "react-icons/fa";
import HotelsPopup from "./HotelsPopup";
import {LogIn, Plane} from "lucide-react";
import {Link} from "react-router-dom";
import {useCities} from "../custom-hooks/useHotelQueries";

// Hotels data configuration - MOVED TO HEADER
const HOTELS_DATA = [
    {
        name: "Tunisie",
        icon: "🇹🇳",
        flag_url: "/images/flags/flag-tunisia.jpg",
        cities: [
            "Sousse", "Hammamet", "Monastir", "Tabarka", "Tunis", "Djerba",
            "Nabeul", "Mahdia", "Gammarth", "Tozeur", "Bizerte", "Gabes", "kairouan", "Gafsa", "Sfax"
        ],
    },
    {
        name: "Algérie",
        icon: "🇩🇿",
        flag_url: "/images/flags/flag-algeria.jpg",
        cities: [
            "Alger", "Annaba", "Constantine", "Skikda", "Oran", "Mostaganem",
            "Ain Timouchent", "Sétif", "Tebssa", "Béjaïa", "Tizi ouzou",
            "Boumerdes", "Batna", "Eloued", "Bechar", "Setif", "Guelma", "El Oued", "Ain Temouchent"
        ],
    },
];

// Separate component for menu items with submenu (not using NavLink)
const MenuItemWithSubmenu = ({item, hoveredMenu, setHoveredMenu, isSubmenuVisible, setIsSubmenuVisible, enrichedCountries, citiesLoading, citiesError}) => {
    const Icon = item.icon;
    const isHovered = hoveredMenu === item.name;

    return (
        <div
            className="relative"
            onMouseEnter={() => {
                setHoveredMenu(item.name);
                setIsSubmenuVisible(true);
            }}
            onMouseLeave={() => {
                setHoveredMenu(null);
                setIsSubmenuVisible(false);
            }}
        >
            <button
                type="button"
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 text-gray-700 ${
                    isHovered ? "text-sky-800" : ""
                }`}
                style={{
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: isHovered
                        ? "0 4px 12px rgba(2, 132, 199, 0.2)"
                        : "none",
                    background: isHovered
                        ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                        : "transparent",
                }}
                onClick={(e) => {
                    e.preventDefault();
                    setIsSubmenuVisible(!isSubmenuVisible);
                }}
            >
                <Icon
                    size={20}
                    className={`text-lg transition-all duration-300 ${
                        isHovered ? "scale-125 rotate-12" : "scale-100"
                    }`}
                />
                <span className="font-medium text-sm whitespace-nowrap">
                    {item.name}
                </span>
                <FaChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isSubmenuVisible ? "transform rotate-180" : ""}`}
                />
                {isHovered && (
                    <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-600 to-transparent animate-pulse"></span>
                )}
            </button>

            <HotelsPopup
                isVisible={isSubmenuVisible}
                onClose={() => setIsSubmenuVisible(false)}
                enrichedCountries={enrichedCountries}
                citiesLoading={citiesLoading}
                citiesError={citiesError}
            />
        </div>
    );
};

// Regular NavLink Component
const RegularMenuItem = ({item, hoveredMenu, setHoveredMenu}) => {
    const Icon = item.icon;
    const isHovered = hoveredMenu === item.name;

    return (
        <NavLink
            to={item.path}
            onMouseEnter={() => setHoveredMenu(item.name)}
            onMouseLeave={() => setHoveredMenu(null)}
            className={({isActive}) =>
                `relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive ? "text-white" : "text-gray-700"
                }`
            }
            style={({isActive}) => ({
                transform:
                    isHovered && !isActive ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isActive
                    ? "0 8px 16px rgba(2, 132, 199, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.1)"
                    : isHovered
                        ? "0 4px 12px rgba(2, 132, 199, 0.2)"
                        : "none",
                background: isActive
                    ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                    : isHovered
                        ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                        : "transparent",
            })}
        >
            {({isActive}) => (
                <>
                    <Icon
                        size={20}
                        className={`text-lg transition-all duration-300 ${
                            isActive
                                ? "scale-110"
                                : isHovered
                                    ? "scale-125 rotate-12"
                                    : "scale-100"
                        } ${isHovered && !isActive ? "text-sky-800" : ""}`}
                        style={{
                            filter: isActive
                                ? "drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))"
                                : "none",
                        }}
                    />
                    <span
                        className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                            isHovered && !isActive ? "text-sky-800 font-semibold" : ""
                        }`}
                    >
                        {item.name}
                    </span>
                    {isHovered && !isActive && (
                        <span
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-600 to-transparent animate-pulse"></span>
                    )}
                </>
            )}
        </NavLink>
    );
};

function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [mobileHotelsOpen, setMobileHotelsOpen] = useState(false);
    const [isSubmenuVisible, setIsSubmenuVisible] = useState(false);

    // NEW: Fetch cities from API using React Query
    const {data: cities, isLoading: citiesLoading, isError: citiesError} = useCities();

    // NEW: Enrich countries with city data from API
    const enrichedCountries = useMemo(() => {
        if (!cities || cities.length === 0) return HOTELS_DATA;

        return HOTELS_DATA.map((country) => {
            // Filter API cities that match the country's city names
            // Extract only Id and Name properties
            const matchedCities = country.cities
                .map((cityName) => {
                    // Find matching city from API (case-insensitive, trim whitespace)
                    const apiCity = cities.find(
                        (c) => c.Name.toLowerCase().trim() === cityName.toLowerCase().trim()
                    );

                    // Return only Id and Name if found
                    return apiCity ? {
                        Id: apiCity.Id,
                        Name: apiCity.Name
                    } : null;
                })
                .filter(Boolean); // Remove null/undefined values

            return {
                ...country,
                citiesData: matchedCities,
            };
        });
    }, [cities]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleCitySelect = (city) => {
        console.log("Selected city:", city);
        // You can add navigation logic here
    };

    const menuItems = [
        {name: "ACCUEIL", icon: FaHome, path: "/"},
        {
            name: "HOTELS",
            icon: FaHotel,
            hasSubmenu: true,
        },
        {
            name: "VOYAGES ORGANISES",
            icon: Plane,
            path: "/voyages-organises",
        },
        {name: "E-VISA", icon: FaPassport, path: "/e-visa"},
        {name: "OFFRES SPECIALES", icon: FaTags, path: "/offres-speciales"},
        {name: "0770 93 25 63", icon: FaPhone, path: "/contact", isPhone: true},
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? "shadow-2xl" : "shadow-xl"
            }`}
            style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
            }}
        >
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo with 3D Effect */}
                    <NavLink
                        to="/"
                        className="flex items-center space-x-4 cursor-pointer group"
                    >
                        <div
                            className="relative transform transition-all duration-300 hover:scale-110"
                            style={{
                                filter: "drop-shadow(0 4px 6px rgba(2, 132, 199, 0.3))",
                            }}
                        >
                            <FaPlane
                                className="text-3xl text-sky-600 transform transition-transform duration-300 group-hover:translate-x-2 group-hover:rotate-12"/>
                            <div
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"
                                style={{
                                    boxShadow: "0 0 10px rgba(249, 115, 22, 0.6)",
                                }}
                            ></div>
                        </div>
                        <div>
                            <h1
                                className="text-2xl font-bold bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 bg-clip-text text-transparent"
                                style={{
                                    textShadow: "0 2px 4px rgba(2, 132, 199, 0.1)",
                                }}
                            >
                                Allez<span className="text-[#f97316]">GO</span>
                            </h1>
                            <p className="text-xs text-gray-500 -mt-1 font-medium">
                                Travel Agency
                            </p>
                        </div>
                    </NavLink>

                    {/* Desktop Navigation with 3D Effects */}
                    <nav className="hidden md:flex md:gap-6 items-center space-x-1">
                        {menuItems.map((item) =>
                            item.hasSubmenu ? (
                                <MenuItemWithSubmenu
                                    key={item.name}
                                    item={item}
                                    hoveredMenu={hoveredMenu}
                                    setHoveredMenu={setHoveredMenu}
                                    isSubmenuVisible={isSubmenuVisible}
                                    setIsSubmenuVisible={setIsSubmenuVisible}
                                    enrichedCountries={enrichedCountries}
                                    citiesLoading={citiesLoading}
                                    citiesError={citiesError}
                                />
                            ) : (
                                <RegularMenuItem
                                    key={item.name}
                                    item={item}
                                    hoveredMenu={hoveredMenu}
                                    setHoveredMenu={setHoveredMenu}
                                />
                            )
                        )}
                    </nav>

                    {/* CTA Button - Desktop with 3D Effect */}
                    <Link
                        to="/signin"
                        className="hidden md:block relative px-6 py-2.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-semibold rounded-lg overflow-hidden group"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow =
                                "0 8px 25px rgba(249, 115, 22, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.2)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow =
                                "0 6px 20px rgba(249, 115, 22, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        <span className="flex justify-center items-center gap-2 relative z-10">
                            <LogIn size={26} strokeWidth={2}/>
                            Connecter
                        </span>
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-gray-700 hover:text-sky-600 transition-all p-2 rounded-lg hover:bg-sky-50"
                        style={{
                            boxShadow: isMobileMenuOpen
                                ? "0 4px 12px rgba(2, 132, 199, 0.3)"
                                : "none",
                            transform: isMobileMenuOpen ? "scale(1.1)" : "scale(1)",
                        }}
                    >
                        {isMobileMenuOpen ? (
                            <FaTimes className="text-2xl"/>
                        ) : (
                            <FaBars className="text-2xl"/>
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div
                    className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
                        isMobileMenuOpen
                            ? "max-h-screen opacity-100 mb-4"
                            : "max-h-0 opacity-0"
                    }`}
                >
                    <nav className="flex flex-col space-y-2 py-4">
                        {menuItems.map((item) => {
                            const Icon = item.icon;

                            // For items with submenu
                            if (item.hasSubmenu) {
                                return (
                                    <div key={item.name} className="flex flex-col">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileHotelsOpen(!mobileHotelsOpen);
                                            }}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-700 hover:bg-sky-50"
                                        >
                                            <Icon className="text-xl"/>
                                            <span className="font-medium">{item.name}</span>
                                            <FaChevronDown
                                                size={14}
                                                className={`ml-auto transition-transform duration-200 ${
                                                    mobileHotelsOpen ? "transform rotate-180" : ""
                                                }`}
                                            />
                                        </button>

                                        {/* Mobile Submenu - Using enrichedCountries */}
                                        <div
                                            className={`overflow-y-auto transition-all duration-300 ${
                                                mobileHotelsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                            }`}
                                        >
                                            <div className="pl-4 pr-2 py-2 space-y-1">
                                                {enrichedCountries.map((country) => (
                                                    <div key={country.name} className="mb-3">
                                                        <h4 className="text-lg font-semibold text-sky-900 mb-1 px-2 flex items-center gap-2">
                                                            <span>{country.icon}</span>
                                                            {country.name}
                                                        </h4>
                                                        {country.citiesData && country.citiesData.length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {country.citiesData.map((city) => (
                                                                    <Link
                                                                        to={`/hotels/city/${city.Id}`}
                                                                        key={city.Id}
                                                                        onClick={() => {
                                                                            handleCitySelect(city);
                                                                            setMobileHotelsOpen(false);
                                                                            setIsMobileMenuOpen(false);
                                                                        }}
                                                                        className="px-2 py-1.5 text-sm bg-sky-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg
                                                                          duration-200 text-left custom-shadow-heavy active:translate-y-1 active:scale-95 transition-all"
                                                                    >
                                                                        {city.Name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 px-2">Chargement...</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Regular menu items
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={({isActive}) =>
                                        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                                            isActive ? "text-white" : "text-gray-700"
                                        }`
                                    }
                                    style={({isActive}) => ({
                                        background: isActive
                                            ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                                            : "transparent",
                                        boxShadow: isActive
                                            ? "0 4px 12px rgba(2, 132, 199, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.1)"
                                            : "none",
                                    })}
                                >
                                    <Icon className="text-xl"/>
                                    <span className="font-medium">{item.name}</span>
                                </NavLink>
                            );
                        })}
                        <Link to="/signin"
                              className="relative flex justify-center items-center gap-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-4 py-3 rounded-lg font-semibold text-white mt-2 overflow-hidden group"
                              style={{
                                  boxShadow:
                                      "0 6px 20px rgba(249, 115, 22, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
                              }}
                              onClick={() => {
                                  setIsMobileMenuOpen(false);
                              }}
                        >
                            <span className="relative z-10">Connecter</span>
                            <LogIn size={20} strokeWidth={2}/>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;
