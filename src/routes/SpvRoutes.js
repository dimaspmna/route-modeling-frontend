import { Routes, Route } from "react-router-dom";
import SpvDashboard from "../pages/spv/SpvDashboard";
import SpvApproval from "../pages/spv/SpvApproval";
const SpvRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<SpvDashboard />} />
        <Route path="Approval" element={<SpvApproval />} />
      </Routes>
    </>
  );
};

export default SpvRoutes;
