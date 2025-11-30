import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getAllCourses, getCategories } from '../../api/courseApi'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Courses.css'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' }
]

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  // Filter states from URL
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || 'All'
  const level = searchParams.get('level') || 'All Levels'
  const sortBy = searchParams.get('sortBy') || 'popular'
  const page = parseInt(searchParams.get('page')) || 1

  const [searchInput, setSearchInput] = useState(search)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [search, category, level, sortBy, page])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data || [])
    } catch (err) {
      console.log('Could not load categories')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (search) params.search = search
      if (category && category !== 'All') params.category = category
      if (level && level !== 'All Levels') params.level = level
      if (sortBy) params.sortBy = sortBy

      const data = await getAllCourses(params)
      setCourses(data.courses || data || [])
      setPagination(data.pagination || null)
    } catch (err) {
      toast.error('Failed to load courses')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value && value !== 'All' && value !== 'All Levels') {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.delete('page') // Reset page on filter change
    setSearchParams(newParams)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilter('search', searchInput)
  }

  const clearFilters = () => {
    setSearchParams({})
    setSearchInput('')
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0)
    return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
  }

  const formatDuration = (mins) => {
    if (!mins) return '0m'
    const hours = Math.floor(mins / 60)
    return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`
  }

  const activeFiltersCount = [
    category !== 'All' && category,
    level !== 'All Levels' && level,
    search
  ].filter(Boolean).length

  return (
    <div className="courses-page">
      {/* Header */}
      <div className="courses-header">
        <div className="container">
          <h1>Explore Courses</h1>
          <p>Discover {pagination?.total || courses.length}+ courses to help you reach your goals</p>
        </div>
      </div>

      <div className="container">
        <div className="courses-layout">
          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              {activeFiltersCount > 0 && (
                <button className="clear-btn" onClick={clearFilters}>
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="filter-group">
              <h4>Search</h4>
              <form onSubmit={handleSearch}>
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button type="submit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Categories */}
            <div className="filter-group">
              <h4>Category</h4>
              <div className="filter-options">
                <label className={`filter-option ${category === 'All' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="category"
                    checked={category === 'All'}
                    onChange={() => updateFilter('category', 'All')}
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat.name}
                    className={`filter-option ${category === cat.name ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={category === cat.name}
                      onChange={() => updateFilter('category', cat.name)}
                    />
                    <span>{cat.name}</span>
                    <span className="count">{cat.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className="filter-group">
              <h4>Level</h4>
              <div className="filter-options">
                {LEVELS.map((l) => (
                  <label
                    key={l}
                    className={`filter-option ${level === l ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="level"
                      checked={level === l}
                      onChange={() => updateFilter('level', l)}
                    />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="close-filters-btn" onClick={() => setShowFilters(false)}>
              Apply Filters
            </button>
          </aside>

          {/* Main Content */}
          <main className="courses-main">
            {/* Toolbar */}
            <div className="courses-toolbar">
              <div className="toolbar-left">
                <button className="filter-toggle-btn" onClick={() => setShowFilters(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>
                  </svg>
                  Filters {activeFiltersCount > 0 && <span className="badge">{activeFiltersCount}</span>}
                </button>
                <span className="results-count">
                  {pagination?.total || courses.length} results
                </span>
              </div>
              <div className="toolbar-right">
                <label>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="active-filters">
                {search && (
                  <span className="filter-tag">
                    "{search}"
                    <button onClick={() => {
                      setSearchInput('')
                      updateFilter('search', '')
                    }}>×</button>
                  </span>
                )}
                {category !== 'All' && (
                  <span className="filter-tag">
                    {category}
                    <button onClick={() => updateFilter('category', 'All')}>×</button>
                  </span>
                )}
                {level !== 'All Levels' && (
                  <span className="filter-tag">
                    {level}
                    <button onClick={() => updateFilter('level', 'All Levels')}>×</button>
                  </span>
                )}
              </div>
            )}

            {/* Course Grid */}
            {loading ? (
              <Loader />
            ) : courses.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No courses found</h3>
                <p>Try adjusting your filters or search term</p>
                <button className="btn-clear" onClick={clearFilters}>Clear all filters</button>
              </div>
            ) : (
              <>
                <div className="courses-grid">
                  {courses.map((course) => (
                    <Link key={course._id} to={`/courses/${course._id}`} className="course-card">
                      <div className="card-thumbnail">
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                          alt={course.title}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' }}
                        />
                        {course.isBestseller && <span className="badge-bestseller">Bestseller</span>}
                        {course.isFree && <span className="badge-free">Free</span>}
                        <div className="card-overlay">
                          <span className="preview-btn">Preview</span>
                        </div>
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{course.title}</h3>
                        <p className="card-instructor">{course.instructorName || 'Expert Instructor'}</p>
                        <div className="card-rating">
                          <span className="rating-value">{(course.rating || 4.5).toFixed(1)}</span>
                          <span className="rating-stars">{renderStars(course.rating || 4.5)}</span>
                          <span className="rating-count">({course.totalRatings || 0})</span>
                        </div>
                        <div className="card-meta">
                          <span>{formatDuration(course.totalDuration)}</span>
                          <span>•</span>
                          <span>{course.totalLessons || 0} lessons</span>
                          <span>•</span>
                          <span>{course.level || 'Beginner'}</span>
                        </div>
                        <div className="card-footer">
                          {course.isFree || course.price === 0 ? (
                            <span className="price-free">Free</span>
                          ) : (
                            <div className="price-group">
                              <span className="price-current">${course.price}</span>
                              {course.originalPrice > course.price && (
                                <span className="price-original">${course.originalPrice}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      disabled={page === 1}
                      onClick={() => updateFilter('page', page - 1)}
                    >
                      ← Previous
                    </button>
                    <span className="page-info">
                      Page {page} of {pagination.pages}
                    </span>
                    <button
                      disabled={page >= pagination.pages}
                      onClick={() => updateFilter('page', page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
