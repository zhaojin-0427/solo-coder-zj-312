import axios from 'axios';

const API_BASE = 'http://localhost:9712/api';

const api = axios.create({ baseURL: API_BASE });

export const getStudents = (params) => api.get('/students/', { params }).then(r => r.data);
export const getStudent = (id) => api.get(`/students/${id}/`).then(r => r.data);
export const createStudent = (data) => api.post('/students/', data).then(r => r.data);
export const updateStudent = (id, data) => api.patch(`/students/${id}/`, data).then(r => r.data);
export const deleteStudent = (id) => api.delete(`/students/${id}/`);

export const getFootProfile = (studentId) => api.get(`/students/${studentId}/foot-profile/`).then(r => r.data);
export const saveFootProfile = (studentId, data) => api.post(`/students/${studentId}/foot-profile/`, data).then(r => r.data);

export const getShoeFittings = (params) => api.get('/shoe-fittings/', { params }).then(r => r.data);
export const createShoeFitting = (data) => api.post('/shoe-fittings/', data).then(r => r.data);
export const updateShoeFitting = (id, data) => api.patch(`/shoe-fittings/${id}/`, data).then(r => r.data);
export const deleteShoeFitting = (id) => api.delete(`/shoe-fittings/${id}/`);

export const getTrainingLogs = (params) => api.get('/training-logs/', { params }).then(r => r.data);
export const createTrainingLog = (data) => api.post('/training-logs/', data).then(r => r.data);
export const updateTrainingLog = (id, data) => api.patch(`/training-logs/${id}/`, data).then(r => r.data);
export const deleteTrainingLog = (id) => api.delete(`/training-logs/${id}/`);

export const getWearAlerts = (params) => api.get('/wear-alerts/', { params }).then(r => r.data);
export const resolveAlert = (id) => api.post(`/wear-alerts/${id}/resolve/`).then(r => r.data);
export const acknowledgeAlert = (id) => api.post(`/wear-alerts/${id}/acknowledge/`).then(r => r.data);
export const handleAlert = (id, data) => api.post(`/wear-alerts/${id}/handle/`, data).then(r => r.data);
export const followupAlert = (id, data) => api.post(`/wear-alerts/${id}/followup/`, data).then(r => r.data);

export const getStatistics = () => api.get('/statistics/').then(r => r.data);
