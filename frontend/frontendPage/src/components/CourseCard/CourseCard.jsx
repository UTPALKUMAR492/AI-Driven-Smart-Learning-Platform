import React, { useState, useContext } from 'react'
import './CourseCard.css'
import { Link, useNavigate } from 'react-router-dom'
import { addToWishlist, removeFromWishlist } from '../../api/courseApi'
import { AuthContext } from '../../context/AuthContext'
import { toast } from 'react-toastify'

export default function CourseCard({ course, isInWishlist = false, onWishlistChange, viewMode = 'grid' }) {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [wishlisted, setWishlisted] = useState(isInWishlist)
  const [imageLoaded, setImageLoaded] = useState(false)

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return '#10b981'
      case 'intermediate':
        return '#f59e0b'
      case 'advanced':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      toast.info("Please login to add to wishlist")
      navigate('/login')
      return
    }

    try {
      if (wishlisted) {
        await removeFromWishlist(course._id)
        setWishlisted(false)
        toast.success("Removed from wishlist")
      } else {
        await addToWishlist(course._id)
        setWishlisted(true)
        toast.success("Added to wishlist")
      }
      onWishlistChange?.()
    } catch (err) {
      toast.error("Failed to update wishlist")
    }
  }

  const formatDuration = (minutes) => {
    if (!minutes) return ''
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const normalizePrice = (course) => {
    if (!course) return { amount: 0, currency: 'USD', discount: 0 };
    if (typeof course.price === 'number') return { amount: course.price, currency: course.currency || 'USD', discount: 0 };
    // support legacy numeric fields and nested price objects
    const p = course.price || (course.price && typeof course.price === 'object' ? course.price : {}) || {};
    // if backend uses `originalPrice` and `price` numeric fields
    if (!p.amount && typeof course.price === 'number') p.amount = course.price
    if (!p.amount && typeof course.originalPrice === 'number') p.amount = course.price || 0
    return { amount: p.amount || 0, currency: p.currency || 'USD', discount: p.discount || 0 };
  }

  const getEnrolledCount = (course) => {
    if (!course) return 0
    return course.enrolledStudents?.count ?? course.studentsEnrolled ?? course.studentsEnrolled === 0 ? course.studentsEnrolled : 0
  }

  const getRatingValue = (course) => {
    // support both course.rating as number and nested shape
    if (!course) return 0
    if (typeof course.rating === 'number') return course.rating
    if (course.rating?.average) return course.rating.average
    if (course.rating?.value) return course.rating.value
    return 0
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>)
      } else {
        stars.push(<span key={i} className="star">★</span>)
      }
    }
    return stars
  }

  const _price = normalizePrice(course)
  const discountedPrice = _price.discount ? _price.amount * (1 - _price.discount / 100) : _price.amount

  if (viewMode === 'list') {
    return (
      <Link to={`/courses/${course._id}`} className="course-card-list">
        <div className="card-list-image">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              onLoad={() => setImageLoaded(true)}
              className={imageLoaded ? 'loaded' : ''}
            />
          ) : (
            <div className="placeholder-image">
              <span>📚</span>
            </div>
          )}
          {_price.discount > 0 && (
            <span className="discount-badge">{_price.discount}% OFF</span>
          )}
        </div>

        <div className="card-list-content">
          <h3 className="course-title">{course.title}</h3>
          <p className="course-description">{course.description}</p>
          
          <div className="course-instructor">
            <span>by {course.instructor?.username || 'Instructor'}</span>
          </div>

          <div className="course-stats">
            {course.rating?.average > 0 && (
              <div className="rating">
                <span className="rating-value">{course.rating.average.toFixed(1)}</span>
                <div className="stars">{renderStars(course.rating.average)}</div>
                <span className="rating-count">({course.rating.count})</span>
              </div>
            )}
            <span className="dot">•</span>
            <span>{course.enrolledStudents?.count || 0} students</span>
            <span className="dot">•</span>
            <span>{course.lessons?.length || 0} lessons</span>
            {course.totalDuration && (
              <>
                <span className="dot">•</span>
                <span>{formatDuration(course.totalDuration)}</span>
              </>
            )}
          </div>

          <div className="course-tags">
            <span 
              className="level-tag"
              style={{ 
                background: `${getLevelColor(course.level)}15`,
                color: getLevelColor(course.level),
                borderColor: getLevelColor(course.level)
              }}
            >
              {course.level || 'All Levels'}
            </span>
            {course.category && (
              <span className="category-tag">{course.category}</span>
            )}
          </div>
        </div>

        <div className="card-list-actions">
          <div className="price-section">
            {_price.amount > 0 ? (
              <>
                <span className="current-price">₹{discountedPrice?.toFixed(2)}</span>
                {_price.discount > 0 && (
                  <span className="original-price">₹{_price.amount?.toFixed(2)}</span>
                )}
              </>
            ) : (
              <span className="current-price free">Free</span>
            )}
          </div>
          
          <button 
            className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {wishlisted ? '❤️' : '🤍'}
          </button>
        </div>
      </Link>
    )
  }

  // Grid view (default)
  return (
    <div className="course-card">
      <Link to={`/courses/${course._id}`} className="card-link">
        <div className="course-card-image">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              onLoad={() => setImageLoaded(true)}
              className={imageLoaded ? 'loaded' : ''}
            />
          ) : (
            <div className="placeholder-image">
              <span>📚</span>
            </div>
          )}
          
          <button 
            className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {wishlisted ? '❤️' : '🤍'}
          </button>

          {_price.discount > 0 && (
            <span className="discount-badge">{_price.discount}% OFF</span>
          )}

          <div 
            className="level-badge" 
            style={{ 
              background: getLevelColor(course.level),
            }}
          >
            {course.level || 'All Levels'}
          </div>
        </div>

        <div className="course-card-body">
          <h3 className="course-title">{course.title}</h3>
          
          <p className="course-instructor">
            {course.instructor?.username || 'Expert Instructor'}
          </p>

            {getRatingValue(course) > 0 ? (
            <div className="course-rating">
              <span className="rating-value">{getRatingValue(course).toFixed(1)}</span>
              <div className="stars">{renderStars(getRatingValue(course))}</div>
              <span className="rating-count">({course.totalRatings || course.rating?.count || 0})</span>
            </div>
          ) : (
            <div className="course-rating">
              <span className="no-rating">New course</span>
            </div>
          )}

            <div className="course-meta">
            <span>{course.lessons?.length || course.totalLessons || 0} lessons</span>
            {course.totalDuration && (
              <>
                <span className="dot">•</span>
                <span>{formatDuration(course.totalDuration)}</span>
              </>
            )}
          </div>
        </div>

        <div className="course-card-footer">
          <div className="price-section">
            {_price.amount > 0 ? (
              <>
                <span className="current-price">₹{discountedPrice?.toFixed(2)}</span>
                {_price.discount > 0 && (
                  <span className="original-price">₹{_price.amount?.toFixed(2)}</span>
                )}
              </>
            ) : (
              <span className="current-price free">Free</span>
            )}
          </div>

          <div className="enrolled-count">
            <span>👥 {getEnrolledCount(course)}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
