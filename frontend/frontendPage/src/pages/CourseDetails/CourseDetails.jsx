import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axiosConfig'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './CourseDetails.css'

export default function CourseDetails(){
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    api.get(`/courses/${id}`)
      .then(res => setCourse(res.data))
      .catch(()=> toast.error("Unable to load course"))
      .finally(()=> setLoading(false))
  },[id])

  if(loading) return <Loader/>
  if(!course) return <div className="container mt-4">Course not found</div>

  return (
    <div className="container mt-4">
      <div className="app-card">
        <h3>{course.title}</h3>
        <p className="text-muted">{course.description}</p>

        <h5 className="mt-3">Topics</h5>
        <ul>
          {course.topics?.map(t => <li key={t._id}>{t.title}</li>)}
        </ul>
      </div>
    </div>
  )
}
