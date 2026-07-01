import apiClient from './apiClient';

export const listQr = () => apiClient.get('/admin/qr');

export const getQr = (id) => apiClient.get(`/admin/qr/${id}`);

export const createQr = (payload) => apiClient.post('/admin/qr', payload);

export const updateQr = (id, payload) => apiClient.put(`/admin/qr/${id}`, payload);

export const regenerateToken = (id) => apiClient.post(`/admin/qr/${id}/regenerate-token`);

// The download endpoint requires admin auth. Since <img>/<a> tags can't attach our
// Authorization header and cross-origin cookie delivery isn't guaranteed in dev
// (different ports), fetch it as an authenticated blob instead of linking directly.
export const fetchQrImageBlob = (id) => apiClient.get(`/admin/qr/${id}/download`, { responseType: 'blob' });

