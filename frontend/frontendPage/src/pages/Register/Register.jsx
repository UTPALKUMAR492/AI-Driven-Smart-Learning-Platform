import React, { useState } from 'react'
import authApi from '../../api/authApi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Register.css'

export default function Register(){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [role, setRole] = useState('student')
  const navigate = useNavigate()
  const [loading,setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Basic client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if(!name || !email || !password){
      toast.error('Please fill all fields')
      setLoading(false)
      return
    }
    if(!emailRegex.test(email)){
      toast.error('Please enter a valid email')
      setLoading(false)
      return
    }
    if(password.length < 8){
      toast.error('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try{
      const res = await authApi.register({ name, email, password, role })
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
          <label htmlFor="name" className="visually-hidden">Full name</label>
          <input id="name" name="name" className="form-control mb-3" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />

          <label htmlFor="email" className="visually-hidden">Email</label>
          <input id="email" name="email" className="form-control mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />

          <label htmlFor="password" className="visually-hidden">Password</label>
          <input id="password" name="password" type="password" className="form-control mb-3" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

          <div className="role-selection mb-3">
            <label className="form-label">I want to:</label>
            <div className="role-options">
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
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading} aria-disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
      </div>
    </div>
  )
}
