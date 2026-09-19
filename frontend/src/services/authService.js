import api from './api';

const TOKEN_KEY = 'votesphere_jwt';
const USER_KEY = 'votesphere_user';
const LEGACY_TOKEN_KEY = 'pulsepoll_jwt';
const LEGACY_USER_KEY = 'pulsepoll_user';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data?.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  },

  getStoredUser() {
    try {
      const u = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },
};

export default authService;
