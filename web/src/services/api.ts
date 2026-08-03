import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  logout: () =>
    api.post('/auth/logout'),
  me: () =>
    api.get('/auth/me'),
  getUsers: () =>
    api.get('/auth/users'),
  updateUser: (id: string, data: any) =>
    api.put(`/auth/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/auth/users/${id}`),
  updateProfile: (data: any) => 
    api.put('/auth/profile', data),
  updatePassword: (data: any) => 
    api.put('/auth/password', data),
}

// Dashboard API
export const dashboardApi = {
  getDashboard: (date?: string) => 
    api.get('/dashboard', { params: { date } }),
  getWeeklyStats: (startDate?: string, endDate?: string) => 
    api.get('/dashboard/weekly-stats', { params: { start_date: startDate, end_date: endDate } }),
  getMonthlyStats: (year?: number, month?: number) => 
    api.get('/dashboard/monthly-stats', { params: { year, month } }),
  getTopClients: (limit?: number) => 
    api.get('/dashboard/top-clients', { params: { limit } }),
  getTripsByStatus: () => 
    api.get('/dashboard/trips-by-status'),
  getTrucksStatus: () => 
    api.get('/dashboard/trucks-status'),
  getFuelConsumption: (startDate?: string, endDate?: string) => 
    api.get('/dashboard/fuel-consumption', { params: { start_date: startDate, end_date: endDate } }),
  getProfitability: (startDate?: string, endDate?: string) => 
    api.get('/dashboard/profitability', { params: { start_date: startDate, end_date: endDate } }),
  getMaintenanceAlerts: () => 
    api.get('/dashboard/maintenance-alerts'),
  getDocumentAlerts: () => 
    api.get('/dashboard/document-alerts'),
  getCalizaArrivals: (date?: string) =>
    api.get('/dashboard/caliza-arrivals', { params: { date } }),
  getDriverDailyTrips: (driverId: string, date?: string) =>
    api.get(`/dashboard/driver-daily/${driverId}`, { params: { date } }),
}

// Trucks API
export const trucksApi = {
  getAll: () => api.get('/trucks'),
  getById: (id: string) => api.get(`/trucks/${id}`),
  create: (data: any) => api.post('/trucks', data),
  update: (id: string, data: any) => api.put(`/trucks/${id}`, data),
  delete: (id: string) => api.delete(`/trucks/${id}`),
  getMaintenanceHistory: (id: string) => api.get(`/trucks/${id}/maintenance-history`),
  createMaintenance: (id: string, data: any) => api.post(`/trucks/${id}/maintenance`, data),
  updateMaintenance: (id: string, maintenanceId: string, data: any) => api.put(`/trucks/${id}/maintenance/${maintenanceId}`, data),
  deleteMaintenance: (id: string, maintenanceId: string) => api.delete(`/trucks/${id}/maintenance/${maintenanceId}`),
  getTires: (id: string) => api.get(`/trucks/${id}/tires`),
  createTire: (id: string, data: any) => api.post(`/trucks/${id}/tires`, data),
  updateTire: (id: string, tireId: string, data: any) => api.put(`/trucks/${id}/tires/${tireId}`, data),
  deleteTire: (id: string, tireId: string) => api.delete(`/trucks/${id}/tires/${tireId}`),
  updateMileage: (id: string, mileage: number) => api.put(`/trucks/${id}/mileage`, { mileage }),
}

// Drivers API
export const driversApi = {
  getAll: () => api.get('/drivers'),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  getTrips: (id: string) => api.get(`/drivers/${id}/trips`),
  getWorkHours: (id: string) => api.get(`/drivers/${id}/work-hours`),
  assignTruck: (id: string, truckId: string) => api.put(`/drivers/${id}/assign-truck`, { truck_id: truckId }),
}

// Trips API
export const tripsApi = {
  getAll: (params?: any) => api.get('/trips', { params }),
  getById: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  update: (id: string, data: any) => api.put(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
  startTrip: (id: string) => api.put(`/trips/${id}/start`),
  deliverTrip: (id: string) => api.put(`/trips/${id}/deliver`),
  returnTrip: (id: string) => api.put(`/trips/${id}/return`),
  cancelTrip: (id: string) => api.put(`/trips/${id}/cancel`),
  uploadEvidence: (id: string, data: any) => api.post(`/trips/${id}/evidence`, data),
  getLocation: (id: string) => api.get(`/trips/${id}/location`),
  getTracking: (id: string) => api.get(`/trips/${id}/tracking`),
  getByDate: (date: string) => api.get('/trips/by-date', { params: { date } }),
  getByDriver: (driverId: string) => api.get(`/trips/by-driver/${driverId}`),
  getLiveFleet: () => api.get('/trips/live'),
    getLiveGeoFences: (radiusKm?: number) => api.get('/trips/live/geofences', { params: { radius_km: radiusKm } }),
    recordGross: (id: string, data: any) => api.post(`/trips/${id}/gross`, data),
    recordTare: (id: string, data: any) => api.post(`/trips/${id}/tare`, data),
    recordQuality: (id: string, data: any) => api.post(`/trips/${id}/quality`, data),
  }

// Flota en vivo unificada (viajes + cantera) — solo super_admin/admin
export const fleetApi = {
  getLive: (radiusKm?: number) => api.get('/fleet/live', { params: { radius_km: radiusKm } }),
}

// Clients API
export const clientsApi = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getPurchases: (id: string) => api.get(`/clients/${id}/purchases`),
  getTrips: (id: string) => api.get(`/clients/${id}/trips`),
  getInvoices: (id: string) => api.get(`/clients/${id}/invoices`),
  updateBalance: (id: string, amount: number, type: 'credit' | 'debit') => 
    api.put(`/clients/${id}/balance`, { amount, type }),
}

// Inventory API
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getById: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  addEntry: (id: string, data: any) => api.post(`/inventory/${id}/entry`, data),
  addExit: (id: string, data: any) => api.post(`/inventory/${id}/exit`, data),
  getMovements: (id: string) => api.get(`/inventory/${id}/movements`),
  getLowStock: () => api.get('/inventory/low-stock'),
  getCriticalStock: () => api.get('/inventory/critical-stock'),
}

// Invoices API
export const invoicesApi = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  markAsSent: (id: string) => api.put(`/invoices/${id}/send`),
  markAsPaid: (id: string, data: any) => api.put(`/invoices/${id}/pay`, data),
  markAsOverdue: (id: string) => api.put(`/invoices/${id}/overdue`),
  cancel: (id: string) => api.put(`/invoices/${id}/cancel`),
  getOverdue: () => api.get('/invoices/overdue'),
  getAccountsReceivable: () => api.get('/invoices/accounts-receivable'),
  getAccountsPayable: () => api.get('/invoices/accounts-payable'),
}

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
}

// Reports API
export const reportsApi = {
  getTonsByClient: (startDate?: string, endDate?: string) =>
    api.get('/reports/tons-by-client', { params: { start_date: startDate, end_date: endDate } }),
  getTripProfitability: (startDate?: string, endDate?: string) => 
    api.get('/reports/trip-profitability', { params: { start_date: startDate, end_date: endDate } }),
  getFuelConsumption: (startDate?: string, endDate?: string) => 
    api.get('/reports/fuel-consumption', { params: { start_date: startDate, end_date: endDate } }),
  getOperationCosts: (startDate?: string, endDate?: string) => 
    api.get('/reports/operation-costs', { params: { start_date: startDate, end_date: endDate } }),
  getFinancialSummary: (startDate?: string, endDate?: string) => 
    api.get('/reports/financial-summary', { params: { start_date: startDate, end_date: endDate } }),
  getTruckPerformance: (startDate?: string, endDate?: string) => 
    api.get('/reports/truck-performance', { params: { start_date: startDate, end_date: endDate } }),
  getDriverPerformance: (startDate?: string, endDate?: string) => 
    api.get('/reports/driver-performance', { params: { start_date: startDate, end_date: endDate } }),
  getMaterialReport: (startDate?: string, endDate?: string) => 
    api.get('/reports/material-report', { params: { start_date: startDate, end_date: endDate } }),
  getInventoryReport: () => api.get('/reports/inventory-report'),
}

export const accountingApi = {
  getReceivable: (params?: any) => api.get('/accounting/accounts-receivable', { params }),
  getPayable: (params?: any) => api.get('/accounting/accounts-payable', { params }),
  storeReceivable: (data: any) => api.post('/accounting/store-receivable', data),
  storePayable: (data: any) => api.post('/accounting/store-payable', data),
  markReceivablePaid: (id: string, data: any) => api.put(`/accounting/receivable/${id}/pay`, data),
  markPayablePaid: (id: string, data: any) => api.put(`/accounting/payable/${id}/pay`, data),
  getReceivableSummary: () => api.get('/accounting/receivable-summary'),
  getPayableSummary: () => api.get('/accounting/payable-summary'),
}

export const settingsApi = {
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data: any) => api.put('/settings/company', data),
}

export const proformasApi = {
  getAll: (params?: any) => api.get('/proformas', { params }),
  getById: (id: string) => api.get(`/proformas/${id}`),
  create: (data: any) => api.post('/proformas', data),
  update: (id: string, data: any) => api.put(`/proformas/${id}`, data),
  delete: (id: string) => api.delete(`/proformas/${id}`),
  getSummary: (date?: string) => api.get('/proformas/summary', { params: { date } }),
  getLive: () => api.get('/proformas/live'),
  getTracking: (id: string) => api.get(`/proformas/${id}/tracking`),
}

export const controlsApi = {
  getAll: (params?: any) => api.get('/controls', { params }),
  getById: (id: string) => api.get(`/controls/${id}`),
  create: (data: any) => api.post('/controls', data),
  update: (id: string, data: any) => api.put(`/controls/${id}`, data),
  delete: (id: string) => api.delete(`/controls/${id}`),
  getSummary: (date?: string) => api.get('/controls/summary', { params: { date } }),
}

export const dispatchesApi = {
  getAll: (params?: any) => api.get('/dispatches', { params }),
  getById: (id: string) => api.get(`/dispatches/${id}`),
  create: (data: any) => api.post('/dispatches', data),
  update: (id: string, data: any) => api.put(`/dispatches/${id}`, data),
  delete: (id: string) => api.delete(`/dispatches/${id}`),
  getSummary: (date?: string) => api.get('/dispatches/summary', { params: { date } }),
}

export const payrollApi = {
  getAll: (params?: any) => api.get('/payrolls', { params }),
  getById: (id: string) => api.get(`/payrolls/${id}`),
  create: (data: any) => api.post('/payrolls', data),
  update: (id: string, data: any) => api.put(`/payrolls/${id}`, data),
  delete: (id: string) => api.delete(`/payrolls/${id}`),
  getByDriver: (driverId: string) => api.get(`/payrolls/by-driver/${driverId}`),
  approve: (id: string) => api.put(`/payrolls/${id}/approve`),
  markAsPaid: (id: string) => api.put(`/payrolls/${id}/pay`),
}

export const extraPaymentsApi = {
  getAll: (params?: any) => api.get('/extra-payments', { params }),
  getById: (id: string) => api.get(`/extra-payments/${id}`),
  create: (data: any) => api.post('/extra-payments', data),
  update: (id: string, data: any) => api.put(`/extra-payments/${id}`, data),
  delete: (id: string) => api.delete(`/extra-payments/${id}`),
  getSummary: (params?: any) => api.get('/extra-payments/summary', { params }),
}

export const pettyCashApi = {
  getAll: (params?: any) => api.get('/petty-cash', { params }),
  getById: (id: string) => api.get(`/petty-cash/${id}`),
  create: (data: any) => api.post('/petty-cash', data),
  update: (id: string, data: any) => api.put(`/petty-cash/${id}`, data),
  delete: (id: string) => api.delete(`/petty-cash/${id}`),
  getSummary: (params?: any) => api.get('/petty-cash/summary', { params }),
}

export const notesApi = {
  getAll: (params?: any) => api.get('/notes', { params }),
  getById: (id: string) => api.get(`/notes/${id}`),
  create: (data: any) => api.post('/notes', data),
  update: (id: string, data: any) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
  getSummary: () => api.get('/notes/summary'),
  getWord: (id: string) => api.get(`/notes/${id}/word`, { responseType: 'blob' }),
}

// División política de Panamá
export const panamaApi = {
  locations: () => api.get('/panama/locations'),
}

// Mensajería WhatsApp (centro de mensajería de la secretaria)
export const whatsappApi = {
  getStatus: () => api.get('/whatsapp/status'),
  getSummary: () => api.get('/whatsapp/summary'),
  getConversations: (params?: any) => api.get('/whatsapp/conversations', { params }),
  getConversation: (id: string) => api.get(`/whatsapp/conversations/${id}`),
  createConversation: (data: any) => api.post('/whatsapp/conversations', data),
  updateConversation: (id: string, data: any) => api.put(`/whatsapp/conversations/${id}`, data),
  deleteConversation: (id: string) => api.delete(`/whatsapp/conversations/${id}`),
  sendMessage: (id: string, content: string) => api.post(`/whatsapp/conversations/${id}/messages`, { content }),
  receiveMessage: (id: string, content: string) => api.post(`/whatsapp/conversations/${id}/receive`, { content }),
  markRead: (id: string) => api.post(`/whatsapp/conversations/${id}/read`),
}

// Espacio de trabajo de la secretaria (agenda, recepción, archivo, logística)
export const secretaryApi = {
  getSummary: () => api.get('/secretary/summary'),
  // Agenda
  getAgenda: (params?: any) => api.get('/secretary/agenda', { params }),
  createAgenda: (data: any) => api.post('/secretary/agenda', data),
  updateAgenda: (id: string, data: any) => api.put(`/secretary/agenda/${id}`, data),
  deleteAgenda: (id: string) => api.delete(`/secretary/agenda/${id}`),
  // Recepción
  getReception: (params?: any) => api.get('/secretary/reception', { params }),
  createReception: (data: any) => api.post('/secretary/reception', data),
  updateReception: (id: string, data: any) => api.put(`/secretary/reception/${id}`, data),
  deleteReception: (id: string) => api.delete(`/secretary/reception/${id}`),
  // Archivo de documentos
  getDocuments: (params?: any) => api.get('/secretary/documents', { params }),
  createDocument: (data: any) => api.post('/secretary/documents', data),
  updateDocument: (id: string, data: any) => api.put(`/secretary/documents/${id}`, data),
  deleteDocument: (id: string) => api.delete(`/secretary/documents/${id}`),
  // Soporte logístico
  getLogistics: (params?: any) => api.get('/secretary/logistics', { params }),
  createLogistic: (data: any) => api.post('/secretary/logistics', data),
  updateLogistic: (id: string, data: any) => api.put(`/secretary/logistics/${id}`, data),
  deleteLogistic: (id: string) => api.delete(`/secretary/logistics/${id}`),
}

// Espacio de trabajo del supervisor de planta (producción, calidad, seguridad, equipo)
export const supervisorApi = {
  getSummary: () => api.get('/supervisor/summary'),
  // Planificación de actividades
  getPlanning: (params?: any) => api.get('/supervisor/planning', { params }),
  createPlanning: (data: any) => api.post('/supervisor/planning', data),
  updatePlanning: (id: string, data: any) => api.put(`/supervisor/planning/${id}`, data),
  deletePlanning: (id: string) => api.delete(`/supervisor/planning/${id}`),
  // Recepción y trituración
  getReception: (params?: any) => api.get('/supervisor/reception', { params }),
  createReception: (data: any) => api.post('/supervisor/reception', data),
  updateReception: (id: string, data: any) => api.put(`/supervisor/reception/${id}`, data),
  deleteReception: (id: string) => api.delete(`/supervisor/reception/${id}`),
  // Mezclado (blending)
  getBlending: (params?: any) => api.get('/supervisor/blending', { params }),
  createBlending: (data: any) => api.post('/supervisor/blending', data),
  updateBlending: (id: string, data: any) => api.put(`/supervisor/blending/${id}`, data),
  deleteBlending: (id: string) => api.delete(`/supervisor/blending/${id}`),
  // Gestión de calidad
  getQuality: (params?: any) => api.get('/supervisor/quality', { params }),
  createQuality: (data: any) => api.post('/supervisor/quality', data),
  updateQuality: (id: string, data: any) => api.put(`/supervisor/quality/${id}`, data),
  deleteQuality: (id: string) => api.delete(`/supervisor/quality/${id}`),
  // Seguridad y medio ambiente
  getSafety: (params?: any) => api.get('/supervisor/safety', { params }),
  createSafety: (data: any) => api.post('/supervisor/safety', data),
  updateSafety: (id: string, data: any) => api.put(`/supervisor/safety/${id}`, data),
  deleteSafety: (id: string) => api.delete(`/supervisor/safety/${id}`),
  // Liderazgo de equipo
  getTasks: (params?: any) => api.get('/supervisor/tasks', { params }),
  createTask: (data: any) => api.post('/supervisor/tasks', data),
  updateTask: (id: string, data: any) => api.put(`/supervisor/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/supervisor/tasks/${id}`),
}

// Espacio de trabajo del contador de costos (costos, activos, presupuestos, cumplimiento)
export const accountantApi = {
  getSummary: () => api.get('/accountant/summary'),
  // Costos de producción
  getCosts: (params?: any) => api.get('/accountant/costs', { params }),
  createCost: (data: any) => api.post('/accountant/costs', data),
  updateCost: (id: string, data: any) => api.put(`/accountant/costs/${id}`, data),
  deleteCost: (id: string) => api.delete(`/accountant/costs/${id}`),
  // Activos y depreciación
  getAssets: (params?: any) => api.get('/accountant/assets', { params }),
  createAsset: (data: any) => api.post('/accountant/assets', data),
  updateAsset: (id: string, data: any) => api.put(`/accountant/assets/${id}`, data),
  deleteAsset: (id: string) => api.delete(`/accountant/assets/${id}`),
  // Presupuestos CAPEX/OPEX
  getBudgets: (params?: any) => api.get('/accountant/budgets', { params }),
  createBudget: (data: any) => api.post('/accountant/budgets', data),
  updateBudget: (id: string, data: any) => api.put(`/accountant/budgets/${id}`, data),
  deleteBudget: (id: string) => api.delete(`/accountant/budgets/${id}`),
  // Cumplimiento tributario y ambiental
  getCompliance: (params?: any) => api.get('/accountant/compliance', { params }),
  createCompliance: (data: any) => api.post('/accountant/compliance', data),
  updateCompliance: (id: string, data: any) => api.put(`/accountant/compliance/${id}`, data),
  deleteCompliance: (id: string) => api.delete(`/accountant/compliance/${id}`),
}

// AI & Predictions API
export const aiApi = {
  getMaintenancePrediction: (truckId: string) => 
    api.get(`/ai/maintenance/${truckId}`),
  getFleetPredictions: () => 
    api.get('/ai/fleet-predictions'),
  predictTripCost: (data: { distance: number; material_type: string; weight: number }) => 
    api.post('/ai/predict-trip-cost', data),
  optimizeRoute: (data: { origin: string; destination: string; material_type: string; weight: number; departure_time?: string }) => 
    api.post('/ai/optimize-route', data),
}
