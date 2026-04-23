import { Routes, Route } from "react-router-dom";
import IpbDashboard from "../pages/ipb/Ipb";
import IpbRouteDashboard from "../pages/ipb/IpbRoute";
import IpbHistory from "../pages/ipb/IpbHistory";
import IpbMonitoring from "../pages/ipb/ipbmonitoring.jsx";

const IpbRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<IpbDashboard />} />
        <Route path="history" element={<IpbHistory />} />
        <Route path="monitoring" element={<IpbMonitoring />} />
        <Route path="generate" element={<IpbRouteDashboard />} />
      </Routes>
    </>
  );
};

export default IpbRoutes;
