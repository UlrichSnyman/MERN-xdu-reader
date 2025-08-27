import axios from 'axios';

function resolveBaseUrl() {
  const raw = (process.env.REACT_APP_API_URL || '').trim();
  console.log('Environment REACT_APP_API_URL:', raw); // Debug log
  
  if (raw) {
    // Full URL provided
    if (/^https?:\/\//i.test(raw)) {
      console.log('Using full URL from env:', raw); // Debug log
      return raw;
    }
    // Handle values like ':5000' or ':5000/api'
    if (raw.startsWith(':')) {
      const base = `${window.location.protocol}//${window.location.hostname}${raw}`;
      console.log('Using port-based URL:', base); // Debug log
      return base;
    }
    // Handle relative paths like '/api'
    if (raw.startsWith('/')) {
      const relativeUrl = `${window.location.origin}${raw}`;
      console.log('Using relative URL:', relativeUrl); // Debug log
      return relativeUrl;
    }
  }
  // Default to hosted API
  const defaultUrl = 'https://mern-xdu-reader.onrender.com/api';
  console.log('Using default URL:', defaultUrl); // Debug log
  return defaultUrl;
}

const API_BASE_URL = resolveBaseUrl();

console.log('API Base URL:', API_BASE_URL); // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', (config.baseURL || '') + (config.url || '')); // Debug log
    const token = localStorage.getItem('authToken');
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error); // Debug log
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data); // Debug log
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, 'URL:', error.config?.url); // Debug log
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { username: string; password: string }) =>
    api.post('/auth/register', userData),
};

// Works API
export const worksAPI = {
  getAll: () => api.get('/works'),
  getById: (id: string) => api.get(`/works/${id}`),
  create: (workData: any) => api.post('/works', workData),
  update: (id: string, workData: any) => api.put(`/works/${id}`, workData),
  delete: (id: string) => api.delete(`/works/${id}`),
  like: (id: string) => api.post(`/works/${id}/like`),
  unlike: (id: string) => api.delete(`/works/${id}/like`),
  // Corrected: server expects POST /works/progress with { workId, pageId }
  updateProgress: (workId: string, pageId: string) => api.post('/works/progress', { workId, pageId }),
  // Corrected: admin endpoint path
  getProgressStats: () => api.get('/works/admin/progress-stats'),
};

// Lore API
export const loreAPI = {
  getAll: (category?: string) => api.get('/lore', { params: { category } }),
  getById: (id: string) => api.get(`/lore/${id}`),
  create: (data: any) => api.post('/lore', data),
  update: (id: string, data: any) => api.put(`/lore/${id}`, data),
  delete: (id: string) => api.delete(`/lore/${id}`),
  like: (id: string) => api.post(`/lore/${id}/like`),
  unlike: (id: string) => api.delete(`/lore/${id}/like`),
};

// Pages API
export const pagesAPI = {
  getById: (id: string) => api.get(`/pages/${id}`),
  create: (data: any) => api.post('/pages', data),
  update: (id: string, data: any) => api.put(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
  like: (id: string) => api.post(`/pages/${id}/like`),
  unlike: (id: string) => api.delete(`/pages/${id}/like`),
  getForWork: (workId: string) => api.get(`/works/${workId}/pages`),
};

// Suggestions API
export const suggestionsAPI = {
  getAll: () => api.get('/suggestions'),
  create: (suggestionData: any) => api.post('/suggestions', suggestionData),
  delete: (id: string) => api.delete(`/suggestions/${id}`),
};

// Comments API
export const commentsAPI = {
  getForContent: (contentId: string) => api.get(`/comments/${contentId}`),
  create: (contentId: string, data: any) => api.post(`/comments`, data),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

export const uploadAPI = {
  uploadPDF: (formData: FormData) => api.post('/upload/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;