import apiClient from './apiClient';

export const listAdminUsers = (params) => apiClient.get('/admin/users', { params });

export const createAdminUser = (payload) => apiClient.post('/admin/users', payload);

export const updateAdminUser = (id, payload) => apiClient.put(`/admin/users/${id}`, payload);

export const deactivateAdminUser = (id) => apiClient.post(`/admin/users/${id}/deactivate`);

export const resetAdminUserPassword = (id, newPassword) =>
  apiClient.post(`/admin/users/${id}/reset-password`, { newPassword });
