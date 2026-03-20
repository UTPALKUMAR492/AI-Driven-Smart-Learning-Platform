import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader/Loader'

export default function ProtectedRoute({children, requiredRole}){
  const auth = useAuth()

  // Defensive: ensure auth shape
  if (!auth || typeof auth !== 'object') {
    console.warn('ProtectedRoute: unexpected auth object, redirecting to login', auth)
    return <Navigate to="/login" replace/>
  }

  const user = auth.user ?? null
  const loading = auth.loading ?? false
  if(!user && !loading && typeof user === 'undefined') {
    console.warn('ProtectedRoute: useAuth returned undefined, falling back to redirect to login')
    return <Navigate to="/login" replace/>
  }
  
  // Wait for auth to be checked before making any decisions
  if(loading) {
    return <Loader />
  }
  
  console.log("ProtectedRoute check - User:", user?.email, "Role:", user?.role, "Required:", requiredRole);
  
  if(!user) return <Navigate to="/login" replace/>
  
  // Role-based access control
  if(requiredRole) {
    // Admin can access everything
    if(user.role === 'admin') return children
    
    // Check if user has the required role
    if(user.role === requiredRole) return children
    
    // Redirect to appropriate dashboard based on user's actual role
    console.log("Role mismatch - redirecting. User role:", user.role, "Required:", requiredRole);
    if(user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace/>
    if(user.role === 'student') return <Navigate to="/student-dashboard" replace/>
    return <Navigate to="/" replace/>
  }
  
  return children
}
