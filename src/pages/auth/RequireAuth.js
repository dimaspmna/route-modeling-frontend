// // src/components/auth/RequireAuth.js
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

// const RequireAuth = ({ children, allowedRoles }) => {
//   const { currentUser } = useAuth();

//   if (!currentUser) {
//     return <Navigate to="/auth/login" replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
//     return <Navigate to="/not-authorized" replace />;
//   }

//   return children;
// };

// export default RequireAuth;