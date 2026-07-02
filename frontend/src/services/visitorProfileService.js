import apiClient from './apiClient';

export const listProfiles = (params) => apiClient.get('/admin/visitor-profiles', { params });

export const getProfile = (id) => apiClient.get(`/admin/visitor-profiles/${id}`);

// Photo is JWT-protected; fetch as a blob through the authed client, then the
// caller creates an object URL (same pattern as the QR image download).
export const getProfilePhoto = (id) =>
  apiClient.get(`/admin/visitor-profiles/${id}/photo`, { responseType: 'blob' });

export const faceCheckout = (id) => apiClient.post(`/admin/visitor-profiles/${id}/face-checkout`);

export const updateProfile = (id, payload) => apiClient.put(`/admin/visitor-profiles/${id}`, payload);

export const reregisterFace = (id, imageBase64) =>
  apiClient.post(`/admin/visitor-profiles/${id}/reregister-face`, { imageBase64 });
