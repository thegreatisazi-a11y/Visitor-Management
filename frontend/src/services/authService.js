import apiClient from './apiClient';

export const login = (email, password) => apiClient.post('/admin/auth/login', { email, password });

export const logout = () => apiClient.post('/admin/auth/logout');

export const forgotPassword = (email) => apiClient.post('/admin/auth/forgot-password', { email });

export const getMe = () => apiClient.get('/admin/auth/me');
