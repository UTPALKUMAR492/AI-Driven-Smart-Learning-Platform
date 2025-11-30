import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourseById, enrollInCourse, rateCourse, addToWishlist, removeFromWishlist } from '../../api/courseApi'
import { getWishlist } from '../../api/studentApi'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import { AuthContext } from '../../context/AuthContext'
import './CourseDetails.css'

export default function CourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({})
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [activeLesson, setActiveLesson] = useState(null)

  useEffect(() => {
    loadCourse()
    if (user) {
      checkWishlist()
    }
  }, [id, user])

  const loadCourse = async () => {
    try {
      const data = await getCourseById(id)
      setCourse(data)
      // Check if user is enrolled
      if (user && data.enrolledStudents?.users?.includes(user._id)) {
        setIsEnrolled(true)
      }
      // Set first lesson as active if enrolled
      if (data.lessons?.length > 0) {
        setActiveLesson(data.lessons[0])
      }
    } catch (err) {
      toast.error("Unable to load course")
    } finally {
      setLoading(false)
    }
  }

  const checkWishlist = async () => {
    try {
      const wishlist = await getWishlist()
      setIsInWishlist(wishlist.some(c => c._id === id))
    } catch (err) {
      console.error('Error checking wishlist:', err)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      toast.info("Please login to enroll")
      navigate('/login')
      return
    }

    setEnrolling(true)
    try {
      await enrollInCourse(id)
      setIsEnrolled(true)
      toast.success("Successfully enrolled in course!")
      loadCourse()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll")
    } finally {
      setEnrolling(false)
    }
  }

  const handleWishlist = async () => {
    if (!user) {
      toast.info("Please login to add to wishlist")
      navigate('/login')
      return
    }

    try {
      if (isInWishlist) {
        await removeFromWishlist(id)
        setIsInWishlist(false)
        toast.success("Removed from wishlist")
      } else {
        await addToWishlist(id)
        setIsInWishlist(true)
        toast.success("Added to wishlist")
      }
    } catch (err) {
      toast.error("Failed to update wishlist")
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    try {
      await rateCourse(id, reviewData)
      toast.success("Review submitted successfully!")
      setShowReviewModal(false)
      setReviewData({ rating: 5, comment: '' })
      loadCourse()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review")
    }
  }

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min'
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins} min`
  }

  const renderStars = (rating, interactive = false, onRate = null) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onRate && onRate(i)}
        >
          ★
        </span>
      )
    }
    return stars
  }

  if (loading) return <Loader />
  if (!course) return <div className="course-not-found">Course not found</div>

  const discountedPrice = course.price?.discount
    ? course.price.amount * (1 - course.price.discount / 100)
    : course.price?.amount

  return (
    <div className="course-details-page">
      {/* Course Header */}
      <div className="course-header-section">
        <div className="course-header-content">
          <nav className="breadcrumb">
            <span onClick={() => navigate('/courses')}>Courses</span>
            <span className="separator">›</span>
            <span>{course.category || 'Development'}</span>
            <span className="separator">›</span>
            <span className="current">{course.title}</span>
          </nav>

          <h1 className="course-title">{course.title}</h1>
          <p className="course-subtitle">{course.description}</p>

          <div className="course-meta">
            {course.rating?.average > 0 && (
              <div className="meta-item rating">
                <span className="rating-number">{course.rating.average.toFixed(1)}</span>
                <div className="stars">{renderStars(Math.round(course.rating.average))}</div>
                <span className="rating-count">({course.rating.count} ratings)</span>
              </div>
            )}
            <div className="meta-item">
              <span className="icon">👥</span>
              <span>{course.enrolledStudents?.count || 0} students</span>
            </div>
            <div className="meta-item">
              <span className="icon">📚</span>
              <span>{course.lessons?.length || 0} lessons</span>
            </div>
            <div className="meta-item">
              <span className="icon">⏱️</span>
              <span>{formatDuration(course.totalDuration)}</span>
            </div>
          </div>

          <div className="course-instructor">
            <img
              src={course.instructor?.avatar || `https://ui-avatars.com/api/?name=${course.instructor?.username || 'Instructor'}&background=667eea&color=fff`}
              alt={course.instructor?.username}
              className="instructor-avatar"
            />
            <div>
              <span className="label">Created by</span>
              <span className="name">{course.instructor?.username || 'Unknown Instructor'}</span>
            </div>
          </div>

          <div className="course-info-badges">
            <span className="badge">
              <span className="icon">📅</span>
              Last updated {new Date(course.updatedAt).toLocaleDateString()}
            </span>
            <span className="badge">
              <span className="icon">🌐</span>
              {course.language || 'English'}
            </span>
            <span className="badge level">
              <span className="icon">📊</span>
              {course.level || 'All Levels'}
            </span>
          </div>
        </div>

        {/* Sticky Sidebar */}
        <div className="course-sidebar">
          <div className="sidebar-card">
            {course.thumbnail ? (
              <div className="preview-video" onClick={() => activeLesson?.isFree && setActiveTab('content')}>
                <img src={course.thumbnail} alt={course.title} />
                <div className="play-overlay">
                  <span className="play-icon">▶</span>
                  <span className="preview-text">Preview this course</span>
                </div>
              </div>
            ) : (
              <div className="preview-placeholder">
                <span className="icon">🎬</span>
              </div>
            )}

            <div className="sidebar-content">
              <div className="price-section">
                {course.price?.discount > 0 ? (
                  <>
                    <span className="current-price">
                      {course.price.currency === 'USD' ? '$' : '₹'}{discountedPrice?.toFixed(2)}
                    </span>
                    <span className="original-price">
                      {course.price.currency === 'USD' ? '$' : '₹'}{course.price.amount?.toFixed(2)}
                    </span>
                    <span className="discount-badge">{course.price.discount}% off</span>
                  </>
                ) : course.price?.amount > 0 ? (
                  <span className="current-price">
                    {course.price.currency === 'USD' ? '$' : '₹'}{course.price.amount?.toFixed(2)}
                  </span>
                ) : (
                  <span className="current-price free">Free</span>
                )}
              </div>

              {isEnrolled ? (
                <button className="btn-go-to-course" onClick={() => setActiveTab('content')}>
                  Go to Course
                </button>
              ) : (
                <>
                  <button
                    className="btn-enroll"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                  <button className="btn-cart">Add to Cart</button>
                </>
              )}

              <button
                className={`btn-wishlist ${isInWishlist ? 'active' : ''}`}
                onClick={handleWishlist}
              >
                <span className="heart">{isInWishlist ? '❤️' : '🤍'}</span>
                {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>

              <div className="guarantee">
                <span className="icon">🔒</span>
                30-Day Money-Back Guarantee
              </div>

              <div className="course-includes">
                <h4>This course includes:</h4>
                <ul>
                  <li>
                    <span className="icon">🎥</span>
                    {formatDuration(course.totalDuration)} on-demand video
                  </li>
                  <li>
                    <span className="icon">📚</span>
                    {course.lessons?.length || 0} lessons
                  </li>
                  <li>
                    <span className="icon">📱</span>
                    Access on mobile and TV
                  </li>
                  <li>
                    <span className="icon">🏆</span>
                    Certificate of completion
                  </li>
                  <li>
                    <span className="icon">♾️</span>
                    Full lifetime access
                  </li>
                </ul>
              </div>

              <div className="share-section">
                <span>Share this course:</span>
                <div className="share-buttons">
                  <button className="share-btn">📧</button>
                  <button className="share-btn">🔗</button>
                  <button className="share-btn">📱</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="course-main-content">
        {/* Tabs */}
        <div className="course-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Course Content
          </button>
          <button
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button
            className={`tab ${activeTab === 'instructor' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructor')}
          >
            Instructor
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* What You'll Learn */}
              {course.whatYouWillLearn?.length > 0 && (
                <section className="learn-section">
                  <h2>What you'll learn</h2>
                  <div className="learn-grid">
                    {course.whatYouWillLearn.map((item, index) => (
                      <div key={index} className="learn-item">
                        <span className="check">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Requirements */}
              {course.requirements?.length > 0 && (
                <section className="requirements-section">
                  <h2>Requirements</h2>
                  <ul className="requirements-list">
                    {course.requirements.map((req, index) => (
                      <li key={index}>
                        <span className="bullet">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Description */}
              <section className="description-section">
                <h2>Description</h2>
                <div className="description-content">
                  {course.description}
                </div>
              </section>

              {/* Topics */}
              {course.topics?.length > 0 && (
                <section className="topics-section">
                  <h2>Topics Covered</h2>
                  <div className="topics-grid">
                    {course.topics.map((topic) => (
                      <div key={topic._id} className="topic-tag">
                        {topic.title}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="content-tab">
              <div className="content-header">
                <h2>Course Content</h2>
                <div className="content-stats">
                  <span>{course.lessons?.length || 0} lessons</span>
                  <span>•</span>
                  <span>{formatDuration(course.totalDuration)} total length</span>
                </div>
              </div>

              {/* Video Player (for enrolled users) */}
              {isEnrolled && activeLesson && (
                <div className="video-player-section">
                  <div className="video-player">
                    {activeLesson.videoUrl ? (
                      <video
                        controls
                        src={activeLesson.videoUrl}
                        poster={course.thumbnail}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="no-video">
                        <span className="icon">🎬</span>
                        <p>Video content will be available soon</p>
                      </div>
                    )}
                  </div>
                  <div className="current-lesson-info">
                    <h3>{activeLesson.title}</h3>
                    <p>{activeLesson.description}</p>
                  </div>
                </div>
              )}

              {/* Lessons List */}
              <div className="lessons-accordion">
                {course.lessons?.map((lesson, index) => (
                  <div
                    key={lesson._id || index}
                    className={`lesson-item ${expandedSections[index] ? 'expanded' : ''} ${activeLesson?._id === lesson._id ? 'active' : ''}`}
                  >
                    <div
                      className="lesson-header"
                      onClick={() => {
                        toggleSection(index)
                        if (isEnrolled || lesson.isFree) {
                          setActiveLesson(lesson)
                        }
                      }}
                    >
                      <div className="lesson-info">
                        <span className="lesson-number">{index + 1}</span>
                        <span className="lesson-title">{lesson.title}</span>
                        {lesson.isFree && !isEnrolled && (
                          <span className="free-badge">Preview</span>
                        )}
                        {!lesson.isFree && !isEnrolled && (
                          <span className="locked-icon">🔒</span>
                        )}
                      </div>
                      <div className="lesson-meta">
                        <span className="lesson-duration">{formatDuration(lesson.duration)}</span>
                        <span className={`expand-icon ${expandedSections[index] ? 'expanded' : ''}`}>▼</span>
                      </div>
                    </div>
                    {expandedSections[index] && (
                      <div className="lesson-content">
                        <p>{lesson.description}</p>
                        {(isEnrolled || lesson.isFree) && (
                          <button
                            className="btn-play-lesson"
                            onClick={() => setActiveLesson(lesson)}
                          >
                            ▶ Play Lesson
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="reviews-header">
                <h2>Student Reviews</h2>
                {isEnrolled && (
                  <button
                    className="btn-write-review"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Rating Summary */}
              <div className="rating-summary">
                <div className="rating-big">
                  <span className="number">{course.rating?.average?.toFixed(1) || '0.0'}</span>
                  <div className="stars">{renderStars(Math.round(course.rating?.average || 0))}</div>
                  <span className="total">Course Rating</span>
                </div>
                <div className="rating-bars">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = course.reviews?.filter(r => r.rating === star).length || 0
                    const percentage = course.reviews?.length > 0 ? (count / course.reviews.length) * 100 : 0
                    return (
                      <div key={star} className="rating-bar-row">
                        <div className="stars-small">{renderStars(star)}</div>
                        <div className="bar">
                          <div className="fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="percentage">{percentage.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="reviews-list">
                {course.reviews?.length > 0 ? (
                  course.reviews.map((review, index) => (
                    <div key={index} className="review-card">
                      <div className="review-header">
                        <img
                          src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.username || 'User'}&background=667eea&color=fff`}
                          alt={review.user?.username}
                          className="reviewer-avatar"
                        />
                        <div className="reviewer-info">
                          <span className="reviewer-name">{review.user?.username || 'Anonymous'}</span>
                          <div className="review-meta">
                            <div className="stars">{renderStars(review.rating)}</div>
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-reviews">
                    <span className="icon">📝</span>
                    <p>No reviews yet. Be the first to review this course!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'instructor' && (
            <div className="instructor-tab">
              <div className="instructor-profile">
                <img
                  src={course.instructor?.avatar || `https://ui-avatars.com/api/?name=${course.instructor?.username || 'Instructor'}&background=667eea&color=fff&size=200`}
                  alt={course.instructor?.username}
                  className="instructor-avatar-large"
                />
                <div className="instructor-info">
                  <h2>{course.instructor?.username || 'Unknown Instructor'}</h2>
                  <p className="instructor-title">{course.instructor?.bio || 'Professional Instructor'}</p>
                  <div className="instructor-stats">
                    <div className="stat">
                      <span className="icon">⭐</span>
                      <span className="value">{course.rating?.average?.toFixed(1) || '0.0'} Instructor Rating</span>
                    </div>
                    <div className="stat">
                      <span className="icon">📝</span>
                      <span className="value">{course.rating?.count || 0} Reviews</span>
                    </div>
                    <div className="stat">
                      <span className="icon">👥</span>
                      <span className="value">{course.enrolledStudents?.count || 0} Students</span>
                    </div>
                    <div className="stat">
                      <span className="icon">🎓</span>
                      <span className="value">1 Course</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="instructor-bio">
                <h3>About the Instructor</h3>
                <p>
                  {course.instructor?.bio ||
                    'This instructor is passionate about teaching and helping students achieve their learning goals. With years of experience in the field, they bring practical knowledge and engaging teaching methods to their courses.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Write a Review</h3>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="rating-select">
                <label>Your Rating:</label>
                <div className="stars-interactive">
                  {renderStars(reviewData.rating, true, (rating) => setReviewData(prev => ({ ...prev, rating })))}
                </div>
              </div>
              <div className="comment-input">
                <label>Your Review:</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this course..."
                  rows={5}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
