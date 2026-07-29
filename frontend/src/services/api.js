import axios from 'axios';

const API_BASE_URL = ''; // Proxied through Vite in development

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  signup: (userData) => api.post('/api/auth/signup', userData),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/api/auth/logout');
  }
};

export const documentsAPI = {
  upload: (formData) => api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/api/documents/'),
  delete: (docId) => api.delete(`/api/documents/${docId}`),
  getHistory: (parentId) => api.get(`/api/documents/history/${parentId}`)
};

export const aiAPI = {
  process: (docId) => api.post(`/api/ai/process/${docId}`),
  getKnowledgeGraph: () => api.get('/api/ai/knowledge-graph'),
  getTimeline: () => api.get('/api/ai/timeline')
};

export const searchAPI = {
  query: (q) => api.get('/api/search/', { params: { q } })
};

export const chatAPI = {
  sendMessage: (content) => api.post('/api/chat/message', { content }),
  getHistory: () => api.get('/api/chat/history'),
  clearHistory: () => api.delete('/api/chat/history')
};

export const analyticsAPI = {
  getStats: () => api.get('/api/analytics/dashboard-stats'),
  getCharts: () => api.get('/api/analytics/charts')
};

export const insightsAPI = {
  getInsights: () => api.get('/api/insights/')
};

export const settingsAPI = {
  get: () => api.get('/api/settings/'),
  update: (settingData) => api.put('/api/settings/', settingData),
  exportData: () => api.post('/api/settings/export'),
  deleteAccount: () => api.delete('/api/settings/delete-account')
};

export const notificationsAPI = {
  getAll: () => api.get('/api/notifications/'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all')
};

export default api;
