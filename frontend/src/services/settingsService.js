import apiClient from './apiClient';

export const getSettings = () => apiClient.get('/admin/settings');

export const updateSettings = (payload) => apiClient.put('/admin/settings', payload);
