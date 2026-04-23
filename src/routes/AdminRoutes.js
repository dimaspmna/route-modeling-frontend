import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../pages/admin/Admin.jsx";
import Profile from "../pages/Profile.jsx";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default AdminRoutes;