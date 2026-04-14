import axios from 'axios'

// Production (Netlify): VITE_API_URL = Railway backend URL
// Local dev: VITE_API_URL is empty → falls back to '/api' (Vite proxy → localhost:5000)
const BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '')
  ? import.meta.env.VITE_API_URL
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler — token expired or invalid
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      // Use replace so the back button doesn't loop
      window.location.replace('/login')
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (data)   => api.post('/auth/login', data),
  createUser:     (data)   => api.post('/auth/create-user', data),
  me:             ()       => api.get('/auth/me'),
  changePassword: (data)   => api.post('/auth/change-password', data),
  resetPassword:  (id, pw) => api.post(`/auth/reset-password/${id}`, { newPassword: pw }),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  dashboard: ()    => api.get('/admin/dashboard'),
  users:     ()    => api.get('/admin/users'),
  deleteUser:(id)  => api.delete(`/admin/users/${id}`),
  classes:   ()    => api.get('/admin/classes'),   // admin: all classes | teacher: assigned classes
}

// ── Students ──────────────────────────────────────────────────
export const studentAPI = {
  create:        (data)     => api.post('/students', data),
  teacherCreate: (data)     => api.post('/students/teacher-create', data),
  bulkUpload:    (formData) => api.post('/students/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll:        (params)   => api.get('/students', { params }),
  getById:       (id)       => api.get(`/students/${id}`),
  update:        (id, data) => api.put(`/students/${id}`, data),
  delete:        (id)       => api.delete(`/students/${id}`),
  myProfile:     ()         => api.get('/students/my/profile'),
  myAttendance:  ()         => api.get('/students/my/attendance'),
}

// ── Teachers ──────────────────────────────────────────────────
export const teacherAPI = {
  getAll:     ()         => api.get('/teachers'),
  getById:    (id)       => api.get(`/teachers/${id}`),
  update:     (id, data) => api.put(`/teachers/${id}`, data),
  delete:     (id)       => api.delete(`/teachers/${id}`),
  mySubjects: ()         => api.get('/teachers/my/subjects'),
  myProfile:  ()         => api.get('/teachers/my/profile'),
}

// ── Subjects ──────────────────────────────────────────────────
export const subjectAPI = {
  create:  (data)     => api.post('/subjects', data),
  getAll:  (params)   => api.get('/subjects', { params }),
  getById: (id)       => api.get(`/subjects/${id}`),
  update:  (id, data) => api.put(`/subjects/${id}`, data),
  delete:  (id)       => api.delete(`/subjects/${id}`),
}

// ── Attendance ────────────────────────────────────────────────
export const attendanceAPI = {
  mark:      (data)   => api.post('/attendance', data),
  markBulk:  (data)   => api.post('/attendance/bulk', data),
  getAll:    (params) => api.get('/attendance', { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  dayTrends: (params) => api.get('/attendance/day-trends', { params }),
  delete:    (id)     => api.delete(`/attendance/${id}`),
}

// ── OTP ───────────────────────────────────────────────────────
export const otpAPI = {
  generate:   (data)      => api.post('/otp/generate', data),   // data: { subjectId, topicName, timeSlot }
  verify:     (data)      => api.post('/otp/verify', data),
  getActive:  (subjectId) => api.get(`/otp/active/${subjectId}`),
  deactivate: (id)        => api.post(`/otp/deactivate/${id}`),
}

// ── Notes ─────────────────────────────────────────────────────
export const notesAPI = {
  create: (data)   => api.post('/notes', data),
  getAll: (params) => api.get('/notes', { params }),
  delete: (id)     => api.delete(`/notes/${id}`),
}

// ── Papers ────────────────────────────────────────────────────
export const paperAPI = {
  save:   (data) => api.post('/papers/save', data),
  getAll: ()     => api.get('/papers'),
  getOne: (id)   => api.get(`/papers/${id}`),
  delete: (id)   => api.delete(`/papers/${id}`),
}

// ── Announcements ─────────────────────────────────────────────
export const announcementAPI = {
  getAll:   ()         => api.get('/announcements'),
  create:   (data)     => api.post('/announcements', data),
  delete:   (id)       => api.delete(`/announcements/${id}`),
  markRead: (id)       => api.post(`/announcements/${id}/read`),
}

// ── Queries ───────────────────────────────────────────────────
export const queryAPI = {
  getAll:        ()         => api.get('/queries'),
  checkTeacher:  ()         => api.get('/queries/check-teacher'),
  create:        (data)     => api.post('/queries', data),
  respond:       (id, data) => api.put(`/queries/${id}/respond`, data),
  reopen:        (id)       => api.put(`/queries/${id}/reopen`),
  markSeen:      (id)       => api.put(`/queries/${id}/seen`),
  classOverview: ()         => api.get('/queries/class-overview'),
}

export default api
