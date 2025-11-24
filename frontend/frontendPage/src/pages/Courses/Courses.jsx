import React, { useState, useEffect } from 'react'
import api from '../../api/axiosConfig'
import CourseCard from '../../components/CourseCard/CourseCard'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Courses.css'

export default function Courses(){
  const [courses, setCourses] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [level, setLevel] = useState("All")

  useEffect(()=>{
    api.get('/courses')
      .then(res => {
        setCourses(res.data)
        setFiltered(res.data)
      })
      .catch(()=> toast.error("Unable to load courses 😢"))
      .finally(()=> setLoading(false))
  },[])

  // --- FILTER FUNCTION ---
  useEffect(() => {
    let data = courses

    // search filter (guard against missing title/description)
    if (search.trim() !== "") {
      const q = search.toLowerCase()
      data = data.filter(c => {
        const title = (c?.title ?? "").toString().toLowerCase()
        const desc = (c?.description ?? "").toString().toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }

    // level filter
    if (level !== "All") {
      data = data.filter(c => c.level === level)
    }

    setFiltered(data)
  }, [search, level, courses])


  if(loading) return <Loader/>

  return (
    <div className="container mt-4">
      <h2 className="page-title">Browse Courses</h2>

      {/* Search Bar */}
      <div className="filter-bar app-card mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <label htmlFor="search-box" className="visually-hidden">Search courses</label>
        <input
          id="search-box"
          name="search"
          type="text"
          placeholder="Search courses..."
          className="form-control search-box"
          value={search}
          onChange={(e)=> setSearch(e.target.value)}
        />

        {/* Level Filters */}
        <div className="filter-buttons d-flex gap-2">
          {["All","Beginner","Intermediate","Advanced"].map(l => (
            <button
              key={l}
              type="button"
              className={`filter-btn ${level === l ? "active" : ""}`}
              onClick={() => setLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted mt-3">No courses match your search.</p>
      ) : (
        <div className="card-list mt-3">
          {filtered.map(c => <CourseCard key={c._id} course={c} />)}
        </div>
      )}
    </div>
  )
}
