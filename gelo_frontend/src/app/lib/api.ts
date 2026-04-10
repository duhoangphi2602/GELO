import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('patientId');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
