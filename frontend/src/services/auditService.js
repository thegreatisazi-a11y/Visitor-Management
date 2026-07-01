import apiClient from './apiClient';

export const listAuditLogs = (params) => apiClient.get('/admin/audit-logs', { params });
