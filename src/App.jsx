import { useEffect, lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Loader from "./ui/Loader.jsx";

// ✅ Lazy load all heavy pages
const Layout = lazy(() => import("./pages/Layout.jsx"));
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const HotelDetails = lazy(() => import("./pages/HotelDetails.jsx"));
const HotelsPerCityPage = lazy(() => import("./pages/HotelsPerCityPage.jsx"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage.jsx"));
const OrganizedTrip = lazy(() => import("./pages/OrganizedTrip.jsx"));
const EVisa = lazy(() => import("./pages/E_Visa.jsx"));
const SignInPage = lazy(() => import("./pages/SignInPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

// Keep OrganizedTrips non-lazy if it's lightweight
import OrganizedTrips from "./components/OrganizedTrips.jsx";

function ScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [location.pathname]);

    return null;
}

function App() {
    return (
        <>
            <ScrollToTop />
            <Suspense
                fallback={
                    <Loader
                        message="Chargement de la page..."
                        size="large"
                        variant="gradient"
                        fullHeight={true}
                    />
                }
            >
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="hotels/:cityId" element={<HotelsPerCityPage />} />
                        <Route path="hotel/:hotelId" element={<HotelDetails />} />
                        <Route path="organized-trip/:tripId" element={<OrganizedTrip />} />
                        <Route path="e-visa" element={<EVisa />} />
                        <Route path="organized-trips" element={<OrganizedTrips />} />
                        <Route path="search-results" element={<SearchResultsPage />} />
                        <Route path="signin" element={<SignInPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
