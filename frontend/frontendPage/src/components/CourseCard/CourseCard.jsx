import React from 'react'
import './CourseCard.css'
import { Link } from 'react-router-dom'

export default function CourseCard({ course }){
  return (
    <div className="course-card app-card">
      <div className="course-top d-flex justify-content-between align-items-start">
        <div>
          <h5 className="mb-1">{course.title}</h5>
          <p className="text-muted small">{course.description || 'Short course description...'}</p>
        </div>
      </div>

      <div className="mt-3 d-flex justify-content-between align-items-center">
        <div className="badge">{course.topics?.length || 0} topics</div>
        <Link to={`/courses/${course._id}`} className="btn btn-primary btn-sm">View</Link>
      </div>
    </div>
  )
}
