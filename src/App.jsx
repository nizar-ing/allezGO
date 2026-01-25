import {useEffect} from "react";
import {Route, Routes, useLocation} from "react-router-dom";
import Layout from "./pages/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import HotelDetails from "./pages/HotelDetails.jsx";
import OrganizedTrip from "./pages/OrganizedTrip.jsx";
import EVisa from "./pages/E_Visa.jsx";

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
                    <Route path="/hotels/:id" element={<HotelDetails />} />
                    <Route path="/trips/:id" element={<OrganizedTrip />} />
                </Route>
            </Routes>
        </>
    )
}

export default App
