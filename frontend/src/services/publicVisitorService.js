import apiClient from './apiClient';

export const checkMobile = (mobileNo) => apiClient.post('/public/visitor/check-mobile', { mobileNo });

export const getPreviousByMobile = (mobileNo) => apiClient.get(`/public/visitor/previous/${mobileNo}`);

export const checkin = (payload) => apiClient.post('/public/visitor/checkin', payload);

export const getCheckoutDetails = (visitorEntryId) => apiClient.get(`/public/visitor/checkout/${visitorEntryId}`);

export const checkout = (payload) => apiClient.post('/public/visitor/checkout', payload);

export const getPublicSettings = () => apiClient.get('/public/settings');

export const registerWithFace = (payload) => apiClient.post('/public/visitor/register-with-face', payload);

export const recognizeFace = (imageBase64) => apiClient.post('/public/visitor/recognize-face', { imageBase64 });

export const confirmFaceCheckin = (payload) => apiClient.post('/public/visitor/confirm-face-checkin', payload);

export const getProfileByVisitorId = (visitorId) => apiClient.get(`/public/visitor/profile/${visitorId}`);
