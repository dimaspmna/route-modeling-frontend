// // src/contexts/AuthContext.js
// import { createContext, useContext, useState, useEffect } from "react";

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Add your authentication logic here
//   const login = (userData) => {
//     setCurrentUser(userData);
//   };

//   const logout = () => {
//     setCurrentUser(null);
//   };

//   const value = {
//     currentUser,
//     loading,
//     login,
//     logout,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }
