import apiClient from './apiClient';

export const getSummary = () => apiClient.get('/admin/dashboard/summary');

export const getAnalytics = () => apiClient.get('/admin/dashboard/analytics');

export const getCharts = (days) => apiClient.get('/admin/dashboard/charts', { params: { days } });
