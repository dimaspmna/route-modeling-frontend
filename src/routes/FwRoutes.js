import { Routes, Route } from "react-router-dom";
import FwDashboard from "../pages/fw/Fw.jsx";
import Profile from "../pages/Profile.jsx";
import FwsHistory from "../pages/fw/FwsHistory.jsx";

const FwRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<FwDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<FwsHistory />} />
      </Routes>
    </>
  );
};

export default FwRoutes;
