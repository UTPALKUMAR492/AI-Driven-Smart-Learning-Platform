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

  const discountedPrice = course.price?.discount
    ? course.price.amount * (1 - course.price.discount / 100)
    : course.price?.amount

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
          {course.price?.discount > 0 && (
            <span className="discount-badge">{course.price.discount}% OFF</span>
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
            {course.price?.amount > 0 ? (
              <>
                <span className="current-price">
                  {course.price.currency === 'USD' ? '$' : '₹'}{discountedPrice?.toFixed(2)}
                </span>
                {course.price.discount > 0 && (
                  <span className="original-price">
                    {course.price.currency === 'USD' ? '$' : '₹'}{course.price.amount?.toFixed(2)}
                  </span>
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

          {course.price?.discount > 0 && (
            <span className="discount-badge">{course.price.discount}% OFF</span>
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

          {course.rating?.average > 0 ? (
            <div className="course-rating">
              <span className="rating-value">{course.rating.average.toFixed(1)}</span>
              <div className="stars">{renderStars(course.rating.average)}</div>
              <span className="rating-count">({course.rating.count})</span>
            </div>
          ) : (
            <div className="course-rating">
              <span className="no-rating">New course</span>
            </div>
          )}

          <div className="course-meta">
            <span>{course.lessons?.length || 0} lessons</span>
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
            {course.price?.amount > 0 ? (
              <>
                <span className="current-price">
                  {course.price.currency === 'USD' ? '$' : '₹'}{discountedPrice?.toFixed(2)}
                </span>
                {course.price.discount > 0 && (
                  <span className="original-price">
                    {course.price.currency === 'USD' ? '$' : '₹'}{course.price.amount?.toFixed(2)}
                  </span>
                )}
              </>
            ) : (
              <span className="current-price free">Free</span>
            )}
          </div>

          <div className="enrolled-count">
            <span>👥 {course.enrolledStudents?.count || 0}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
