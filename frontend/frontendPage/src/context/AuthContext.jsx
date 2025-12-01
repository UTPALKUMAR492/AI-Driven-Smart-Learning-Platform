import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosConfig'

export const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if(token){
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

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/';
  }

  return <AuthContext.Provider value={{ user, setUser, loading, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
