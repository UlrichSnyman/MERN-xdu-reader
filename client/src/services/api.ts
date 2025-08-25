import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mern-xdu-reader.onrender.com/api';

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
    const token = localStorage.getItem('authToken');
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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