import React, { useState, useEffect } from "react";
import { NavLink } from "react-router";
import {
  FaHome,
  FaHotel,
  FaSuitcaseRolling,
  FaTags,
  FaBars,
  FaTimes,
  FaPlane,
  FaPhone,
  FaPassport,
  FaChevronDown,
} from "react-icons/fa";
import { MdOutlineEventAvailable } from "react-icons/md";
import HotelsPopup, { HOTELS_DATA } from "./HotelsPopup";

// Separate component for menu items with submenu (not using NavLink)
const MenuItemWithSubmenu = ({ item, hoveredMenu, setHoveredMenu, handleCitySelect }) => {
  const Icon = item.icon;
  const isHovered = hoveredMenu === item.name;
  const [isSubmenuVisible, setIsSubmenuVisible] = useState(false);

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
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-600 to-transparent animate-pulse"></span>
          )}
        </button>

        <HotelsPopup
            isVisible={isSubmenuVisible}
            onClose={() => setIsSubmenuVisible(false)}
            onCitySelect={handleCitySelect}
        />
      </div>
  );
};

// Regular NavLink Component
const RegularMenuItem = ({ item, hoveredMenu, setHoveredMenu }) => {
  const Icon = item.icon;
  const isHovered = hoveredMenu === item.name;

  return (
      <NavLink
          to={item.path}
          onMouseEnter={() => setHoveredMenu(item.name)}
          onMouseLeave={() => setHoveredMenu(null)}
          className={({ isActive }) =>
              `relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive ? "text-white" : "text-gray-700"
              }`
          }
          style={({ isActive }) => ({
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
        {({ isActive }) => (
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
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-600 to-transparent animate-pulse"></span>
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
    // For example: navigate(`/hotels?city=${encodeURIComponent(city)}`);
  };

  const menuItems = [
    { name: "ACCUEIL", icon: FaHome, path: "/" },
    {
      name: "HOTELS",
      icon: FaHotel,
      hasSubmenu: true,
    },
    {
      name: "VOYAGES ORGANISES",
      icon: FaSuitcaseRolling,
      path: "/voyages-organises",
    },
    { name: "E-VISA", icon: FaPassport, path: "/e-visa" },
    { name: "OFFRES SPECIALES", icon: FaTags, path: "/offres-speciales" },
    { name: "0770 93 25 63", icon: FaPhone, path: "/contact", isPhone: true },
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
                <FaPlane className="text-3xl text-sky-600 transform transition-transform duration-300 group-hover:translate-x-2 group-hover:rotate-12" />
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
                          handleCitySelect={handleCitySelect}
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

            {/* CTA Button - Desktop with 3D Effect (Hidden on mobile) */}
            <button
                className="hidden md:block relative px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg overflow-hidden group"
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
              <MdOutlineEventAvailable size={20} />
              Réserver
            </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
            </button>

            {/* Mobile Menu Button with 3D Effect */}
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
                  <FaTimes className="text-2xl" />
              ) : (
                  <FaBars className="text-2xl" />
              )}
            </button>
          </div>

          {/* Mobile Navigation with 3D Effects */}
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

                // For items with submenu, render as button with expandable submenu
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
                          <Icon className="text-xl" />
                          <span className="font-medium">{item.name}</span>
                          <FaChevronDown
                              size={14}
                              className={`ml-auto transition-transform duration-200 ${
                                  mobileHotelsOpen ? "transform rotate-180" : ""
                              }`}
                          />
                        </button>

                        {/* Mobile Submenu */}
                        <div
                            className={`overflow-y-auto transition-all duration-300 ${
                                mobileHotelsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                            }`}
                        >
                          <div className="pl-4 pr-2 py-2 space-y-1">
                            {HOTELS_DATA.map((country) => (
                                <div key={country.name} className="mb-3">
                                  <h4 className="text-lg font-semibold text-sky-900 mb-1 px-2">
                                    {country.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-1">
                                    {country.cities.map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => {
                                              handleCitySelect(city);
                                              setMobileHotelsOpen(false);
                                              setIsMobileMenuOpen(false);
                                            }}
                                            className="px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors duration-200 text-left"
                                        >
                                          {city}
                                        </button>
                                    ))}
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  );
                }

                // Regular menu items use NavLink
                return (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                        }}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                                isActive ? "text-white" : "text-gray-700"
                            }`
                        }
                        style={({ isActive }) => ({
                          background: isActive
                              ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                              : "transparent",
                          boxShadow: isActive
                              ? "0 4px 12px rgba(2, 132, 199, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.1)"
                              : "none",
                        })}
                    >
                      <Icon className="text-xl" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                );
              })}
              <button
                  className="relative px-4 py-3 rounded-lg font-semibold text-white mt-2 overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    boxShadow:
                        "0 6px 20px rgba(249, 115, 22, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
                  }}
              >
                <span className="relative z-10">Réserver Maintenant</span>
              </button>
            </nav>
          </div>
        </div>
      </header>
  );
}

export default Header;
