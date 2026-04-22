// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ecommerce-3rcc.onrender.com/api'
    : 'https://ecommerce-3rcc.onrender.com/api';

export default API_BASE_URL;