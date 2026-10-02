import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coverme_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register/', data),
  login: (data) => api.post('/api/auth/login/', data),
  getMe: () => api.get('/api/auth/me/'),
  updateMe: (data) => api.patch('/api/auth/me/', data),
};

export const organizationAPI = {
  getMyClub: () => api.get('/api/organizations/clubs/me/'),
  updateMyClub: (data) => api.patch('/api/organizations/clubs/me/', data),
  getRoster: (status = '') => api.get(`/api/organizations/roster/${status ? `?status=${status}` : ''}`),
  addCoachByEmail: (email, status = 'PENDING', notes = '') =>
    api.post('/api/organizations/roster/add-by-email/', { email, status, notes }),
  setCoachStatus: (rosterId, status, notes) =>
    api.patch(`/api/organizations/roster/${rosterId}/set-status/`, { status, notes }),
};

export const workerAPI = {
  getMyProfile: () => api.get('/api/workers/coaches/me/'),
  updateMyProfile: (data) => api.patch('/api/workers/coaches/me/', data),
  getQualifications: () => api.get('/api/workers/qualifications/'),
  addQualification: (data) => api.post('/api/workers/qualifications/', data),
  deleteQualification: (id) => api.delete(`/api/workers/qualifications/${id}/`),
  searchCoaches: (params = {}) => {
    const query = new URLSearchParams();
    if (params.day !== undefined && params.day !== '') query.append('day', params.day);
    if (params.discipline) query.append('discipline', params.discipline);
    if (params.level) query.append('level', params.level);
    if (params.city) query.append('city', params.city);
    if (params.approved_only) query.append('approved_only', 'true');
    return api.get(`/api/workers/search/?${query.toString()}`);
  },
};

export const coverAPI = {
  getAvailability: () => api.get('/api/covers/availability/'),
  addAvailability: (data) => api.post('/api/covers/availability/', data),
  deleteAvailability: (id) => api.delete(`/api/covers/availability/${id}/`),
  getRequests: () => api.get('/api/covers/requests/'),
  createRequest: (data) => api.post('/api/covers/requests/', data),
  applyForCover: (requestId, pitch_note = '') =>
    api.post(`/api/covers/requests/${requestId}/apply/`, { pitch_note }),
  getApplications: (requestId) =>
    api.get(`/api/covers/requests/${requestId}/applications/`),
  acceptApplication: (requestId, applicationId) =>
    api.post(`/api/covers/requests/${requestId}/accept-application/`, { application_id: applicationId }),
  directAssign: (requestId, workerId) =>
    api.post(`/api/covers/requests/${requestId}/direct-assign/`, { worker_id: workerId }),
};

export default api;
