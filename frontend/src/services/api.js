import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('votesphere_jwt') || localStorage.getItem('pulsepoll_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error message extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected server error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    // If 401 Unauthorized, automatically clear token if expired
    if (error.response?.status === 401 && window.location.pathname.startsWith('/dashboard')) {
      localStorage.removeItem('pulsepoll_jwt');
      localStorage.removeItem('pulsepoll_user');
      window.location.href = '/login?expired=true';
    }

    return Promise.reject(customError);
  }
);

export default api;
