import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "../pages/home/Welcome";
import AuthRoutes from "./AuthRoutes";
import UserRoutes from "./UserRoutes";
import AdminRoutes from "./AdminRoutes";
import FuelRoutes from "./FuelRoutes";
import FwRoutes from "./FwRoutes";
import PassengerRoutes from "./PassengerRoutes";
import FleetRoutes from "./FleetRoutes";
import SpvRoutes from "./SpvRoutes";
import CaptainRoutes from "./CaptainRoutes";
import SuperAdminRoutes from "./SuperAdminRoutes";

import Login from "../pages/auth/login/Login";
import Register from "../pages/auth/register/Register";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "./ProtectedRoute"; // tambahkan ini
import IpbRoutes from "./IpbRoutes";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />

        {/* Authentication Routes */}
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Route (butuh login) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Role-based Protected Routes */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute role="user">
              <UserRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="admin">
              <AdminRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel/*"
          element={
            <ProtectedRoute role="fuel">
              <FuelRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fw/*"
          element={
            <ProtectedRoute role="fw">
              <FwRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/*"
          element={
            <ProtectedRoute role="passenger">
              <PassengerRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fleet/*"
          element={
            <ProtectedRoute role="fleet">
              <FleetRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/spv/*"
          element={
            <ProtectedRoute role="spv">
              <SpvRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/captain/*"
          element={
            <ProtectedRoute role="captain">
              <CaptainRoutes/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute role="superadmin">
              <SuperAdminRoutes/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ipb/*"
          element={
            <ProtectedRoute role="ipb">
              <IpbRoutes/>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
