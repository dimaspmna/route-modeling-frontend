import { Routes, Route } from "react-router-dom";
import CaptainDashboard from "../pages/captain/Captain.jsx"
// import Profile from "../pages/Profile.jsx";
// import FleetsMonitoring from "../pages/fleet/FleetsMonitoring.jsx";
// import FleetHistory from "../pages/fleet/FleetHistory.jsx";
// import FleetRoute from "../pages/fleet/FleetRoute.jsx";

const CaptainRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<CaptainDashboard />} />
        {/* <Route path="profile" element={<Profile />} />
        <Route path="monitoring" element={<FleetsMonitoring />} />
        <Route path="history" element={<FleetHistory />} />
        <Route path="route" element={<FleetRoute />} /> */}
      </Routes>
    </>
  );
};

export default CaptainRoutes;
