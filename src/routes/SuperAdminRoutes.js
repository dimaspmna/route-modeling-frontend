import { Routes, Route } from "react-router-dom";
import SuperAdminDashboard from "../pages/superadmin/SuperAdmin.jsx";
import UserDataComponent from "../pages/superadmin/data/UserDataComponent.jsx";
import FuelPriceDashboard from "../pages/superadmin/transaction/FuelPriceDashboard.jsx";
import CaptainDataComponent from "../pages/superadmin/data/CaptainDataComponent.jsx";
const SuperAdminRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="users" element={<UserDataComponent />} />
        <Route path="captains" element={<CaptainDataComponent />} />
        <Route path="fuel-price" element={<FuelPriceDashboard />} />
        
      </Routes>
    </>
  );
};

export default SuperAdminRoutes;
