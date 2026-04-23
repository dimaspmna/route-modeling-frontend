import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // ambil dari .env
  headers: {
    "Content-Type": "application/json",
  },
});

// (optional) interceptors untuk auto-attach token JWT
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // atau sessionStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
