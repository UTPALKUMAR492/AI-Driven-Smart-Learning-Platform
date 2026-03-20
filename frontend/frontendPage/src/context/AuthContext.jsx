import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosConfig'

export const AuthContext = createContext()

function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if(token){
      // ensure Authorization header present for initial request
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      api.get('/auth/me')
        .then(res => {
          console.log('Auth restored - User:', res.data.email, 'Role:', res.data.role)
          setUser(res.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  },[])

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Logout API failed', err?.response?.data || err.message)
    }
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    window.location.href = '/';
  }

  return <AuthContext.Provider value={{ user, setUser, loading, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Return a safe default to avoid crashes when provider is missing
    return { user: null, setUser: () => {}, loading: false, logout: () => {} }
  }
  return ctx
}

export { AuthProvider }
