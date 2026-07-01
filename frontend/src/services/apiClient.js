import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ivp_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && window.location.pathname.startsWith('/admin') && !window.location.pathname.endsWith('/login')) {
      localStorage.removeItem('ivp_admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  const data = error.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => d.message).join(', ');
  }
  return data?.message || error.message || 'Something went wrong. Please try again.';
}

export default apiClient;
