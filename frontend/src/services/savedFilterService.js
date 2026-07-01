import apiClient from './apiClient';

export const listSavedFilters = (moduleName) => apiClient.get('/admin/saved-filters', { params: { moduleName } });

export const createSavedFilter = (payload) => apiClient.post('/admin/saved-filters', payload);

export const updateSavedFilter = (id, payload) => apiClient.put(`/admin/saved-filters/${id}`, payload);

export const deleteSavedFilter = (id) => apiClient.delete(`/admin/saved-filters/${id}`);
