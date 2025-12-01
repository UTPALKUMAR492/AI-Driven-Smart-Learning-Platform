import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader/Loader'

export default function ProtectedRoute({children, requiredRole}){
  const {user, loading} = useAuth()
  
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
