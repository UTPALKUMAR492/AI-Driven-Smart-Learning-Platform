import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary'
import safeImport from '../utils/safeImport'

// Lazy load pages to surface module import errors and improve HMR behavior
const Home = React.lazy(() => safeImport(() => import('../pages/Home/Home')))
const Login = React.lazy(() => safeImport(() => import('../pages/Login/Login')))
const Register = React.lazy(() => safeImport(() => import('../pages/Register/Register')))
const Courses = React.lazy(() => safeImport(() => import('../pages/Courses/Courses')))
const CourseDetails = React.lazy(() => safeImport(() => import('../pages/CourseDetails/CourseDetails')))
const Quiz = React.lazy(() => safeImport(() => import('../pages/Quiz/Quiz')))
const Results = React.lazy(() => safeImport(() => import('../pages/Results/Results')))
const Dashboard = React.lazy(() => safeImport(() => import('../pages/Dashboard/Dashboard')))
const NotFound = React.lazy(() => safeImport(() => import('../pages/NotFound/NotFound')))

export default function AppRouter(){
  return (
    <BrowserRouter>
      <Navbar />
      <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/courses" element={<Courses/>} />
          <Route path="/courses/:id" element={<CourseDetails/>} />
          <Route path="/quiz/:quizId" element={<Quiz/>} />
          <Route path="/results/:resultId" element={<Results/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
