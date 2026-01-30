import {useEffect} from "react";
import {Route, Routes, useLocation} from "react-router-dom";
import Layout from "./pages/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import HotelDetails from "./pages/HotelDetails.jsx";
import OrganizedTrip from "./pages/OrganizedTrip.jsx";
import EVisa from "./pages/E_Visa.jsx";
import OrganizedTrips from "./components/OrganizedTrips.jsx";
import {destinations} from "./data/data.js";
import HotelsPerCityPage from "./pages/HotelsPerCityPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";

function ScrollToTop() {
    const location = useLocation();
    useEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: "smooth"});
    }, [location.pathname]);
    return null;
}

function App() {
    return (
        <>
            <ScrollToTop/>
            <Routes>
                <Route element={<Layout/>}>
                    <Route index element={<HomePage/>}/>
                    <Route path="/e-visa" element={<EVisa />}/>
                    <Route path="/hotels/city/:cityId" element={<HotelsPerCityPage />} />
                    <Route path="/hotels/:hotelId" element={<HotelDetails />} />
                    <Route path="/voyages-organises" element={<OrganizedTrips destinations={destinations} />} />
                    <Route path="/trips/:id" element={<OrganizedTrip />} />
                    <Route path="/signin" element={<SignInPage />} />
                </Route>
            </Routes>
        </>
    )
}

export default App
