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

export const getTrainingPlans = (params) => api.get('/training-plans/', { params }).then(r => r.data);
export const getTrainingPlan = (id) => api.get(`/training-plans/${id}/`).then(r => r.data);
export const createTrainingPlan = (data) => api.post('/training-plans/', data).then(r => r.data);
export const updateTrainingPlan = (id, data) => api.patch(`/training-plans/${id}/`, data).then(r => r.data);
export const deleteTrainingPlan = (id) => api.delete(`/training-plans/${id}/`);
export const assessPlanRisk = (id) => api.post(`/training-plans/${id}/assess-risk/`).then(r => r.data);
export const completePlan = (id) => api.post(`/training-plans/${id}/complete/`).then(r => r.data);
export const pausePlan = (id) => api.post(`/training-plans/${id}/pause/`).then(r => r.data);
export const resumePlan = (id) => api.post(`/training-plans/${id}/resume/`).then(r => r.data);

export const getWeeklyRecords = (params) => api.get('/weekly-records/', { params }).then(r => r.data);
export const getWeeklyRecord = (id) => api.get(`/weekly-records/${id}/`).then(r => r.data);
export const createWeeklyRecord = (data) => api.post('/weekly-records/', data).then(r => r.data);
export const updateWeeklyRecord = (id, data) => api.patch(`/weekly-records/${id}/`, data).then(r => r.data);
export const submitWeeklyRecord = (id, data) => api.post(`/weekly-records/${id}/submit/`, data).then(r => r.data);

export const getPhaseEvaluations = (params) => api.get('/phase-evaluations/', { params }).then(r => r.data);
export const createPhaseEvaluation = (data) => api.post('/phase-evaluations/', data).then(r => r.data);
export const updatePhaseEvaluation = (id, data) => api.patch(`/phase-evaluations/${id}/`, data).then(r => r.data);
export const deletePhaseEvaluation = (id) => api.delete(`/phase-evaluations/${id}/`);

export const getPlanRiskAlerts = () => api.get('/plan-risk-alerts/').then(r => r.data);
export const getPlanStatistics = () => api.get('/plan-statistics/').then(r => r.data);

export const getInjuryInterventions = (params) => api.get('/injury-interventions/', { params }).then(r => r.data);
export const getInjuryIntervention = (id) => api.get(`/injury-interventions/${id}/`).then(r => r.data);
export const createInjuryIntervention = (data) => api.post('/injury-interventions/', data).then(r => r.data);
export const updateInjuryIntervention = (id, data) => api.patch(`/injury-interventions/${id}/`, data).then(r => r.data);
export const deleteInjuryIntervention = (id) => api.delete(`/injury-interventions/${id}/`);
export const pauseIntervention = (id) => api.post(`/injury-interventions/${id}/pause/`).then(r => r.data);
export const resumeIntervention = (id) => api.post(`/injury-interventions/${id}/resume/`).then(r => r.data);
export const closeIntervention = (id) => api.post(`/injury-interventions/${id}/close/`).then(r => r.data);
export const getInterventionReviews = (id) => api.get(`/injury-interventions/${id}/reviews/`).then(r => r.data);

export const getRehabilitationReviews = (params) => api.get('/rehabilitation-reviews/', { params }).then(r => r.data);
export const createRehabilitationReview = (data) => api.post('/rehabilitation-reviews/', data).then(r => r.data);
export const updateRehabilitationReview = (id, data) => api.patch(`/rehabilitation-reviews/${id}/`, data).then(r => r.data);

export const getInterventionReminders = (params) => api.get('/intervention-reminders/', { params }).then(r => r.data);
export const acknowledgeInterventionReminder = (id, data) => api.post(`/intervention-reminders/${id}/acknowledge/`, data).then(r => r.data);
export const resolveInterventionReminder = (id, data) => api.post(`/intervention-reminders/${id}/resolve/`, data).then(r => r.data);
export const dismissInterventionReminder = (id) => api.post(`/intervention-reminders/${id}/dismiss/`).then(r => r.data);
export const generateInterventionReminders = () => api.post('/intervention-reminders/generate-reminders/').then(r => r.data);

export const getRehabilitationStatistics = () => api.get('/rehabilitation-statistics/').then(r => r.data);
