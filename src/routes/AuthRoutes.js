import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/login/Login";
import Register from "../pages/auth/register/Register";
// import ForgotPassword from "../components/pages/password/forgotPassword";

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      {/* <Route path="forgot-password" element={<ForgotPassword />} /> */}
    </Routes>
  );
};

export default AuthRoutes;