import { Routes, Route } from "react-router-dom";
import PassengerDashboard from "../pages/passenger/Passenger.jsx";
import PassengersHistory from "../pages/passenger/PassengersHistory.jsx";
import Profile from "../pages/Profile.jsx";

const PassengerRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<PassengerDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<PassengersHistory />} />
      </Routes>
    </>
  );
};

export default PassengerRoutes;
