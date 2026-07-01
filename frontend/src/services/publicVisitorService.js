import apiClient from './apiClient';

export const checkMobile = (mobileNo) => apiClient.post('/public/visitor/check-mobile', { mobileNo });

export const getPreviousByMobile = (mobileNo) => apiClient.get(`/public/visitor/previous/${mobileNo}`);

export const checkin = (payload) => apiClient.post('/public/visitor/checkin', payload);

export const getCheckoutDetails = (visitorEntryId) => apiClient.get(`/public/visitor/checkout/${visitorEntryId}`);

export const checkout = (payload) => apiClient.post('/public/visitor/checkout', payload);

export const getPublicSettings = () => apiClient.get('/public/settings');
