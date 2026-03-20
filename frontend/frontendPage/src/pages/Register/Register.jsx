import React, { useState } from 'react'
import authApi from '../../api/authApi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Register.css'

export default function Register(){
  const params = new URLSearchParams(window.location.search)
  const paramRole = params.get('role')
  const initialRole = paramRole === 'teacher' ? 'teacher' : 'student'
  const isAdminParam = paramRole === 'admin'

  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [role, setRole] = useState(initialRole)
  const navigate = useNavigate()
  const [loading,setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (isAdminParam) {
      toast.error('Admin accounts cannot be created via this form. Contact site administrator.')
      return
    }
    setLoading(true)
    // Basic client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name || !email || !password) {
      toast.error('Please fill all fields');
      setLoading(false);
      return;
    }
    if (!nameRegex.test(name)) {
      toast.error('Name must only contain letters and spaces');
      setLoading(false);
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try{
      // Ensure role is valid (radio should enforce this, but sanitize anyway)
      const sendRole = role === 'teacher' ? 'teacher' : 'student'
      const res = await authApi.register({ name, email, password, role: sendRole })
      // If backend returns a token, store it
      if(res?.token) authApi.setToken(res.token)
      toast.success(res?.message || 'Account created 🎉')
      navigate('/login')
    } catch(err){
      // err may be the server response object (authApi throws response.data)
      const serverMessage = err?.message || (typeof err === 'string' ? err : null)
      toast.error(serverMessage || 'Registration failed')
      // Safer logging to avoid circular object formatting errors in devtools
      try { console.error('Registration error:', err?.message ?? String(err)) } catch(e) { console.error('Registration error: (unserializable)') }
    } finally { setLoading(false) }
  }

  return (
    <div className="container" style={{paddingTop:48}}>
      <div className="app-card col-md-5 mx-auto">
        <h3 className="page-title">Create account</h3>
        <form onSubmit={submit}>
          {isAdminParam && (
            <div className="alert alert-warning" role="alert" style={{marginBottom:12}}>
              Admin registration is disabled. Admin accounts are created by the system administrator only.
            </div>
          )}
          <label htmlFor="name" className="visually-hidden">Full name</label>
          <input id="name" name="name" className="form-control mb-3" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />

          <label htmlFor="email" className="visually-hidden">Email</label>
          <input id="email" name="email" className="form-control mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />

          <label htmlFor="password" className="visually-hidden">Password</label>
          <input id="password" name="password" type="password" className="form-control mb-3" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

          <div className="role-selection mb-3">
            <label className="form-label">I want to:</label>
            <div className="role-options">
              {/* If role is provided via URL, show only that role as selected */}
              {paramRole ? (
                <div className="role-single">
                  <div className={`role-option active`}>
                    <span className="role-icon">{role === 'teacher' ? '👨‍🏫' : '🎓'}</span>
                    <span className="role-label">{role === 'teacher' ? 'Teach' : 'Learn'}</span>
                    <span className="role-desc">{role === 'teacher' ? 'Create and publish courses' : 'Enroll in courses and take quizzes'}</span>
                  </div>
                </div>
              ) : (
                <>
                  <label className={`role-option ${role === 'student' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="student" 
                      checked={role === 'student'} 
                      onChange={(e) => setRole(e.target.value)} 
                    />
                    <span className="role-icon">🎓</span>
                    <span className="role-label">Learn</span>
                    <span className="role-desc">Enroll in courses and take quizzes</span>
                  </label>
                  <label className={`role-option ${role === 'teacher' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="teacher" 
                      checked={role === 'teacher'} 
                      onChange={(e) => setRole(e.target.value)} 
                    />
                    <span className="role-icon">👨‍🏫</span>
                    <span className="role-label">Teach</span>
                    <span className="role-desc">Create and publish courses</span>
                  </label>
                </>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading || isAdminParam} aria-disabled={loading || isAdminParam}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
      </div>
    </div>
  )
}
