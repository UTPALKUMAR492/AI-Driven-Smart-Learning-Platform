import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

// attach token from localStorage on each request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// response interceptor to attempt refresh on 401
let isRefreshing = false
let refreshSubscribers = []

function subscribeToken(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  res => res,
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)

    // if 401 and not retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // queue request until refresh completes
        return new Promise((resolve, reject) => {
          subscribeToken((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true
      try {
        // build refresh URL from configured baseURL without mangling the protocol
        const configured = (api.defaults && api.defaults.baseURL) ? String(api.defaults.baseURL) : (import.meta.env.VITE_API_URL || 'http://localhost:5000')
        const base = configured.replace(/\/$/, '')
        let refreshUrl
        if (base.endsWith('/api')) {
          refreshUrl = `${base}/auth/refresh`
        } else {
          refreshUrl = `${base}/api/auth/refresh`
        }
        const resp = await axios.post(refreshUrl, {}, { withCredentials: true })
        const newToken = resp.data.token
        if (newToken) {
          localStorage.setItem('token', newToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          onRefreshed(newToken)
          return api(originalRequest)
        }
      } catch (e) {
        // refresh failed -> redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
