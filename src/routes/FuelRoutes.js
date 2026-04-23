import { Routes, Route } from "react-router-dom";
import FuelDashboard from "../pages/fuel/Fuel.jsx";
import FuelHistory from "../pages/fuel/FuelsHistory.jsx";
import Profile from "../pages/Profile.jsx";

const FuelRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<FuelDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<FuelHistory />} />
      </Routes>
    </>
  );
};

export default FuelRoutes;
