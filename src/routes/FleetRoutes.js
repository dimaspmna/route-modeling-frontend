import { Routes, Route } from "react-router-dom";
import FleetDashboard from "../pages/fleet/Fleet.jsx";
import Profile from "../pages/Profile.jsx";
import FleetsMonitoring from "../pages/fleet/FleetsMonitoring.jsx";
import FleetHistory from "../pages/fleet/FleetHistory.jsx";
import FleetCaptainDashboard from "../pages/fleet/FleetCaptainDashboard.jsx";
import FleetRoute from "../pages/fleet/FleetRoute.jsx";

const FleetRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<FleetDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="captain" element={<FleetCaptainDashboard />} />
        <Route path="monitoring" element={<FleetsMonitoring />} />
        <Route path="history" element={<FleetHistory />} />
        <Route path="route" element={<FleetRoute />} />
      </Routes>
    </>
  );
};

export default FleetRoutes;
