// API Configuration
const LOCAL_API_BASE_URL = "http://localhost:5000/api";
const REMOTE_API_BASE_URL = "https://ecommerce-3rcc.onrender.com/api";
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (isLocalHost ? LOCAL_API_BASE_URL : REMOTE_API_BASE_URL);

export default API_BASE_URL;
export { LOCAL_API_BASE_URL, REMOTE_API_BASE_URL };
