import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axiosConfig'

const AuthContext = createContext()

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if(token){
      api.get('/auth/me').then(res => setUser(res.data)).catch(()=>{})
    }
  },[])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/';
  }

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
