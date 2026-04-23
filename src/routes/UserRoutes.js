import { Routes, Route } from "react-router-dom";
import UsersDashboard from "../pages/users/Users.jsx";
import UsersHistory from "../pages/users/UsersHistory.jsx";
import Profile from "../pages/Profile.jsx";

const UserRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="dashboard" element={<UsersDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="history" element={<UsersHistory />} />
        
      </Routes>
    </>
  );
};

export default UserRoutes;
