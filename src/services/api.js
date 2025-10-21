import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5150/api';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'fallback-token';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
});

export default api;
