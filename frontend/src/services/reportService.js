import apiClient from './apiClient';

export const getReportData = (params) => apiClient.get('/admin/reports', { params });

export const listExportHistory = (params) => apiClient.get('/admin/reports/exports', { params });

export const exportReport = (payload) =>
  apiClient.post('/admin/reports/export', payload, { responseType: 'blob' });
