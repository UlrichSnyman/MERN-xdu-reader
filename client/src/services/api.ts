import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      config.headers.Authorization = `Bearer ${token}`;
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

export const worksAPI = {
  getAll: () => api.get('/works'),
  getById: (id: string) => api.get(`/works/${id}`),
  create: (workData: any) => api.post('/works', workData),
  update: (id: string, workData: any) => api.put(`/works/${id}`, workData),
  delete: (id: string) => api.delete(`/works/${id}`),
  like: (id: string) => api.post(`/works/${id}/like`),
  updateProgress: (workId: string, pageId: string) => api.post('/works/progress', { workId, pageId }),
  getProgressStats: () => api.get('/works/admin/progress-stats'),
};

export const pagesAPI = {
  getById: (id: string) => api.get(`/pages/${id}`),
  create: (pageData: any) => api.post('/pages', pageData),
  update: (id: string, pageData: any) => api.put(`/pages/${id}`, pageData),
  delete: (id: string) => api.delete(`/pages/${id}`),
  like: (id: string) => api.post(`/pages/${id}/like`),
};

export const loreAPI = {
  getAll: (category?: string) => api.get('/lore', { params: { category } }),
  getById: (id: string) => api.get(`/lore/${id}`),
  create: (loreData: any) => api.post('/lore', loreData),
  update: (id: string, loreData: any) => api.put(`/lore/${id}`, loreData),
  delete: (id: string) => api.delete(`/lore/${id}`),
  like: (id: string) => api.post(`/lore/${id}/like`),
};

export const commentsAPI = {
  getByContentId: (contentId: string) => api.get(`/comments/${contentId}`),
  create: (commentData: any) => api.post('/comments', commentData),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

export const suggestionsAPI = {
  getAll: () => api.get('/suggestions'),
  create: (suggestionData: any) => api.post('/suggestions', suggestionData),
  delete: (id: string) => api.delete(`/suggestions/${id}`),
};

export const uploadAPI = {
  uploadPDF: (formData: FormData) => api.post('/upload/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;