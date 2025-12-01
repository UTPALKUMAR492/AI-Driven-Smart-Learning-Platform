import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllQuizzes } from '../../api/quizApi'
import QuizCard from '../../components/QuizCard/QuizCard'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Quizzes.css'

export default function Quizzes() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("All")
  const [courseFilter, setCourseFilter] = useState("All")

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const data = await getAllQuizzes()
        setQuizzes(data)
        setFiltered(data)
      } catch (error) {
        toast.error("Failed to load quizzes")
      } finally {
        setLoading(false)
      }
    }
    fetchQuizzes()
  }, [])

  // Filter quizzes based on search and filters
  useEffect(() => {
    let result = quizzes

    // Search filter
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase()
      result = result.filter(quiz => {
        const title = (quiz?.title ?? "").toLowerCase()
        const description = (quiz?.description ?? "").toLowerCase()
        return title.includes(query) || description.includes(query)
      })
    }

    // Difficulty filter
    if (difficultyFilter !== "All") {
      result = result.filter(quiz => quiz.difficulty === difficultyFilter)
    }

    // Course filter
    if (courseFilter !== "All") {
      result = result.filter(quiz => quiz.courseId?._id === courseFilter)
    }

    setFiltered(result)
  }, [searchTerm, difficultyFilter, courseFilter, quizzes])

  // Get unique courses for filter
  const courses = [...new Set(quizzes.map(q => q.courseId).filter(Boolean))]

  if (loading) return <Loader />

  return (
    <div className="quizzes-page">
      <div className="quizzes-container container">
        {/* Header */}
        <div className="quizzes-header">
          <div className="header-content">
            <h1 className="page-title">Available Quizzes</h1>
            <p className="page-subtitle">Test your knowledge and track your progress</p>
          </div>
          <div className="quiz-stats">
            <div className="stat-item">
              <span className="stat-number">{quizzes.length}</span>
              <span className="stat-label">Total Quizzes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filtered.length}</span>
              <span className="stat-label">Available</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section app-card">
          <div className="search-bar">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search quizzes..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clear-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label">Difficulty</label>
            <div className="filter-buttons">
              {["All", "Beginner", "Intermediate", "Advanced"].map(level => (
                <button
                  key={level}
                  className={`filter-btn ${difficultyFilter === level ? "active" : ""}`}
                  onClick={() => setDifficultyFilter(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {courses.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">Course</label>
              <select
                className="course-select"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="All">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="empty-state app-card">
            <div className="empty-icon">🔍</div>
            <h3>No Quizzes Found</h3>
            <p>Try adjusting your search or filters</p>
            <button 
              className="reset-btn"
              onClick={() => {
                setSearchTerm("")
                setDifficultyFilter("All")
                setCourseFilter("All")
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="quizzes-grid">
            {filtered.map(quiz => (
              <QuizCard key={quiz._id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
