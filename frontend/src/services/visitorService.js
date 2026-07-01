import apiClient from './apiClient';

export const listEntries = (params) => apiClient.get('/admin/visitors', { params });

export const getDistinctValues = (field, params) => apiClient.get(`/admin/visitors/distinct/${field}`, { params });

export const getEntry = (id) => apiClient.get(`/admin/visitors/${id}`);

export const updateEntry = (id, payload) => apiClient.put(`/admin/visitors/${id}`, payload);

export const cancelEntry = (id, cancellationReason) =>
  apiClient.post(`/admin/visitors/${id}/cancel`, { cancellationReason });

export const adminCloseEntry = (id) => apiClient.post(`/admin/visitors/${id}/admin-close`);

export const listCurrentlyInside = (params) => apiClient.get('/admin/currently-inside', { params });

export const listOutSessions = (params) => apiClient.get('/admin/out-sessions', { params });

export const logPrint = (payload) => apiClient.post('/admin/visitors/print-log', payload);
