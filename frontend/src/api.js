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

export const getShoeInventory = (params) => api.get('/shoe-inventory/', { params }).then(r => r.data);
export const getShoeInventoryItem = (id) => api.get(`/shoe-inventory/${id}/`).then(r => r.data);
export const createShoeInventory = (data) => api.post('/shoe-inventory/', data).then(r => r.data);
export const updateShoeInventory = (id, data) => api.patch(`/shoe-inventory/${id}/`, data).then(r => r.data);
export const deleteShoeInventory = (id) => api.delete(`/shoe-inventory/${id}/`);
export const getAvailableShoes = (params) => api.get('/shoe-inventory/available/', { params }).then(r => r.data);
export const getLowStockShoes = () => api.get('/shoe-inventory/low-stock/').then(r => r.data);
export const setShoeStatus = (id, status) => api.post(`/shoe-inventory/${id}/set-status/`, { status }).then(r => r.data);

export const getShoeBorrowings = (params) => api.get('/shoe-borrowings/', { params }).then(r => r.data);
export const getShoeBorrowing = (id) => api.get(`/shoe-borrowings/${id}/`).then(r => r.data);
export const createShoeBorrowing = (data) => api.post('/shoe-borrowings/', data).then(r => r.data);
export const updateShoeBorrowing = (id, data) => api.patch(`/shoe-borrowings/${id}/`, data).then(r => r.data);
export const deleteShoeBorrowing = (id) => api.delete(`/shoe-borrowings/${id}/`);
export const checkBorrowingConflict = (params) => api.get('/shoe-borrowings/check-conflict/', { params }).then(r => r.data);
export const borrowShoe = (id, notes) => api.post(`/shoe-borrowings/${id}/borrow/`, { notes }).then(r => r.data);
export const cancelBorrowing = (id) => api.post(`/shoe-borrowings/${id}/cancel/`).then(r => r.data);

export const getReturnChecks = (params) => api.get('/shoe-return-checks/', { params }).then(r => r.data);
export const createReturnCheck = (data) => api.post('/shoe-return-checks/', data).then(r => r.data);
export const updateReturnCheck = (id, data) => api.patch(`/shoe-return-checks/${id}/`, data).then(r => r.data);

export const getInventoryAlerts = (params) => api.get('/inventory-alerts/', { params }).then(r => r.data);
export const acknowledgeInventoryAlert = (id, data) => api.post(`/inventory-alerts/${id}/acknowledge/`, data).then(r => r.data);
export const resolveInventoryAlert = (id, data) => api.post(`/inventory-alerts/${id}/resolve/`, data).then(r => r.data);
export const dismissInventoryAlert = (id) => api.post(`/inventory-alerts/${id}/dismiss/`).then(r => r.data);
export const generateInventoryAlerts = () => api.post('/inventory-alerts/generate-alerts/').then(r => r.data);

export const getInventoryStatistics = () => api.get('/inventory-statistics/').then(r => r.data);

export const getStudentBorrowings = (studentId, params) => api.get(`/shoe-borrowings/`, { params: { ...params, student: studentId } }).then(r => r.data);
export const getFittingBorrowings = (fittingId, params) => api.get(`/shoe-borrowings/`, { params: { ...params, fitting: fittingId } }).then(r => r.data);
