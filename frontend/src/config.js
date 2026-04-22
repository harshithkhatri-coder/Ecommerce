// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : '/api';

export default API_BASE_URL;
