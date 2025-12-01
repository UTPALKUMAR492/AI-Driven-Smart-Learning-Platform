import api from './axiosConfig'

/**
 * Auth API wrapper
 * - Uses the axios instance from `axiosConfig.js` (baseURL configured there)
 * - Returns `data` on success and throws server response `data` on error
 */

const extract = (res) => res?.data
const extractError = (err) => {
  // Prefer structured server response when available
  if (err?.response?.data) throw err.response.data
  throw err
}

const register = async ({ name, email, password, role }) => {
  try {
    const res = await api.post('/auth/register', { name, email, password, role })
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

const login = async ({ email, password }) => {
  try {
    const res = await api.post('/auth/login', { email, password })
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

const getMe = async () => {
  try {
    const res = await api.get('/auth/me')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

const logout = () => {
  // simple client-side logout helper
  localStorage.removeItem('token')
}

const setToken = (token) => {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export default {
  register,
  login,
  getMe,
  logout,
  setToken,
}
