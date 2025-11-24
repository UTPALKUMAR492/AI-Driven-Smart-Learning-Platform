import React from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'
import { useAuth } from '../../context/AuthContext'

export default function Navbar(){
  const { user, logout } = useAuth()
  return (
    <header className="navbar-custom">
      <div className="container d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <Link to="/" className="brand">
            <div className="brand-mark">SE</div>
            <div className="brand-text">SmartEdu</div>
          </Link>

          <nav className="d-none d-md-flex align-items-center gap-3">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
          </nav>
        </div>

        <div className="d-flex align-items-center gap-3">
          {user ? (
            <>
              <div className="user-pill">{user.name?.split(' ')[0]}</div>
              <button className="btn btn-outline-secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-primary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
