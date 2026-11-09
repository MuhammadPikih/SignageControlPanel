import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMe = () => api.get('/auth/me')

// ─── Devices ───────────────────────────────────────────────
export const getDevices = () => api.get('/devices')
export const getDevice = (id) => api.get(`/devices/${id}`)
export const createDevice = (data) => api.post('/devices', data)
export const updateDevice = (id, data) => api.put(`/devices/${id}`, data)
export const deleteDevice = (id) => api.delete(`/devices/${id}`)
export const pushContent = (deviceId, contentId) =>
  api.post(`/devices/${deviceId}/push`, { contentId })

export const getPlaylist = (deviceId) =>
  api.get(`/devices/${deviceId}/playlist`)
export const addToPlaylist = (deviceId, data) =>
  api.post(`/devices/${deviceId}/playlist`, data)
export const removeFromPlaylist = (deviceId, playlistId) =>
  api.delete(`/devices/${deviceId}/playlist/${playlistId}`)
export const pushPlaylist = (deviceId) =>
  api.post(`/devices/${deviceId}/playlist/push`)

// ─── Contents ──────────────────────────────────────────────
export const getContents = () => api.get('/contents')
export const getContent = (id) => api.get(`/contents/${id}`)
export const createContent = (formData) =>
  api.post('/contents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const updateContent = (id, formData) =>
  api.put(`/contents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const deleteContent = (id) => api.delete(`/contents/${id}`)

export default api
