import axios from 'axios';

// Normalize API URL: strip trailing slashes and redundant '/api' suffixes
let rawUrl = (import.meta.env.VITE_API_URL || '').trim();
rawUrl = rawUrl.replace(/\/+$/, '');
if (rawUrl.endsWith('/api')) {
  rawUrl = rawUrl.slice(0, -4);
}

// In local development, default to '/api' to use Vite proxy.
// In production on Render/Vercel, if VITE_API_URL is set, use it; otherwise fall back to '/api'.
const baseURL = rawUrl ? `${rawUrl}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds to allow Render free tier to wake up from cold start
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
    let errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;

    // Friendly, actionable message if a 404 occurs on production
    if (error.response?.status === 404) {
      if (!rawUrl && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        errorMessage =
          'Backend connection missing (404): In Render Dashboard -> your Static Site -> Environment, set VITE_API_URL to your backend URL (e.g. https://votesphere-backend.onrender.com) and click "Manual Deploy" -> "Clear build cache & deploy".';
      } else {
        errorMessage = `API endpoint not found (404) at ${error.config?.baseURL || ''}${error.config?.url || ''}. Check if your backend URL is correct.`;
      }
    }

    const customError = {
      message: errorMessage || 'An unexpected server error occurred',
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
