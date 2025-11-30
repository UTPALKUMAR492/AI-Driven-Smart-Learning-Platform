import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getStudentStats, getRecentActivity, getRecommendations, getQuizHistory, getEnrolledCourses, getWishlist } from '../../api/studentApi'
import Loader from '../../components/Loader/Loader'
import { AuthContext } from '../../context/AuthContext'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [quizHistory, setQuizHistory] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, activityData, recommendationsData, historyData, coursesData, wishlistData] = await Promise.all([
        getStudentStats().catch(() => null),
        getRecentActivity().catch(() => []),
        getRecommendations().catch(() => []),
        getQuizHistory().catch(() => []),
        getEnrolledCourses().catch(() => []),
        getWishlist().catch(() => [])
      ])
      
      setStats(statsData || {
        quizzesCompleted: quizHistory?.length || 0,
        averageScore: 0,
        coursesEnrolled: 0,
        streak: 0
      })
      setRecentActivity(activityData || [])
      setRecommendations(recommendationsData || [])
      setQuizHistory(historyData || [])
      setEnrolledCourses(coursesData || [])
      setWishlist(wishlistData || [])
    } catch (error) {
      toast.error(error?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min'
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins} min`
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.round(rating || 0) ? 'filled' : ''}`}>★</span>
      )
    }
    return stars
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="student-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header-section">
        <div className="container">
          <div className="header-content">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Student'}&background=667eea&color=fff&size=200`}
              alt={user?.name}
              className="user-avatar"
            />
            <div className="user-info">
              <h1>Welcome back, {user?.name || 'Student'}!</h1>
              <p>Continue your learning journey</p>
            </div>
          </div>
          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              My Courses ({enrolledCourses.length})
            </button>
            <button
              className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              Wishlist ({wishlist.length})
            </button>
            <button
              className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              Quiz History
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-container container">
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon courses">📚</div>
                <div className="stat-content">
                  <h3 className="stat-value">{enrolledCourses.length || stats?.coursesEnrolled || 0}</h3>
                  <p className="stat-label">Enrolled Courses</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon quizzes">📝</div>
                <div className="stat-content">
                  <h3 className="stat-value">{quizHistory.length || stats?.quizzesCompleted || 0}</h3>
                  <p className="stat-label">Quizzes Completed</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon score">🎯</div>
                <div className="stat-content">
                  <h3 className="stat-value">{stats?.averageScore || 0}%</h3>
                  <p className="stat-label">Average Score</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon streak">🔥</div>
                <div className="stat-content">
                  <h3 className="stat-value">{stats?.streak || 0}</h3>
                  <p className="stat-label">Day Streak</p>
                </div>
              </div>
            </div>

            {/* Continue Learning */}
            {enrolledCourses.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Continue Learning</h2>
                  <Link to="#" onClick={() => setActiveTab('courses')}>View All →</Link>
                </div>
                <div className="continue-learning-grid">
                  {enrolledCourses.slice(0, 3).map((course) => (
                    <div key={course._id} className="continue-course-card">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={course.title}
                        className="course-thumbnail"
                      />
                      <div className="course-info">
                        <h3>{course.title}</h3>
                        <p className="instructor">by {course.instructor?.name || 'Instructor'}</p>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="progress-info">
                          <span>{course.progress || 0}% complete</span>
                          <span>{course.lessonsCompleted || 0}/{course.lessons?.length || 0} lessons</span>
                        </div>
                        <button
                          className="btn-continue"
                          onClick={() => navigate(`/courses/${course._id}`)}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-content">
              {/* Recent Activity */}
              <div className="dashboard-section card">
                <h2 className="section-title">
                  <span className="icon">🕒</span>
                  Recent Activity
                </h2>
                {recentActivity.length > 0 ? (
                  <div className="activity-list">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className={`activity-badge ${activity.type}`}>
                          {activity.type === 'quiz' ? '📝' : '📚'}
                        </div>
                        <div className="activity-details">
                          <p className="activity-title">{activity.title}</p>
                          <p className="activity-subtitle">{activity.subtitle}</p>
                        </div>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No recent activity. Start learning!</p>
                )}
              </div>

              {/* Recommendations */}
              <div className="dashboard-section card">
                <h2 className="section-title">
                  <span className="icon">⭐</span>
                  Recommended for You
                </h2>
                {recommendations.length > 0 ? (
                  <div className="recommendations-list">
                    {recommendations.map((item, index) => (
                      <div key={index} className="recommendation-item">
                        <div className="recommendation-icon">📚</div>
                        <div className="recommendation-details">
                          <h4 className="recommendation-title">{item.title}</h4>
                          <p className="recommendation-description">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-recommendations">
                    <p className="empty-message">Complete more courses to get personalized recommendations!</p>
                    <Link to="/courses" className="btn-browse">Browse Courses</Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'courses' && (
          <div className="courses-tab">
            <h2>My Enrolled Courses</h2>
            {enrolledCourses.length > 0 ? (
              <div className="enrolled-courses-grid">
                {enrolledCourses.map((course) => (
                  <div key={course._id} className="enrolled-course-card">
                    <div className="course-thumbnail-container">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={course.title}
                      />
                      <div className="thumbnail-overlay">
                        <button onClick={() => navigate(`/courses/${course._id}`)}>
                          Continue Learning
                        </button>
                      </div>
                    </div>
                    <div className="course-details">
                      <h3>{course.title}</h3>
                      <p className="instructor">by {course.instructor?.name || 'Instructor'}</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                        <span>{course.progress || 0}% complete</span>
                      </div>
                      <div className="course-meta">
                        <span>{course.lessons?.length || 0} lessons</span>
                        <span>•</span>
                        <span>{formatDuration(course.totalDuration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses yet</h3>
                <p>Start your learning journey by enrolling in a course</p>
                <Link to="/courses" className="btn-browse">Browse Courses</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="wishlist-tab">
            <h2>My Wishlist</h2>
            {wishlist.length > 0 ? (
              <div className="wishlist-grid">
                {wishlist.map((course) => (
                  <div key={course._id} className="wishlist-course-card">
                    <div className="course-thumbnail-container">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                        alt={course.title}
                      />
                    </div>
                    <div className="course-details">
                      <h3>{course.title}</h3>
                      <p className="instructor">by {course.instructor?.name || 'Instructor'}</p>
                      {course.rating?.average > 0 && (
                        <div className="course-rating">
                          <span className="rating-value">{course.rating.average.toFixed(1)}</span>
                          <div className="stars">{renderStars(course.rating.average)}</div>
                          <span className="rating-count">({course.rating.count})</span>
                        </div>
                      )}
                      <div className="price-section">
                        {course.price?.amount > 0 ? (
                          <>
                            <span className="current-price">
                              {course.price.currency === 'USD' ? '$' : '₹'}
                              {(course.price.discount
                                ? course.price.amount * (1 - course.price.discount / 100)
                                : course.price.amount
                              ).toFixed(2)}
                            </span>
                            {course.price.discount > 0 && (
                              <span className="original-price">
                                {course.price.currency === 'USD' ? '$' : '₹'}{course.price.amount.toFixed(2)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="current-price free">Free</span>
                        )}
                      </div>
                      <button
                        className="btn-enroll"
                        onClick={() => navigate(`/courses/${course._id}`)}
                      >
                        View Course
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">❤️</div>
                <h3>Your wishlist is empty</h3>
                <p>Save courses you're interested in for later</p>
                <Link to="/courses" className="btn-browse">Browse Courses</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="quizzes-tab">
            <h2>Quiz History</h2>
            {quizHistory.length > 0 ? (
              <div className="quiz-history-table">
                <div className="table-header">
                  <div className="table-cell">Quiz</div>
                  <div className="table-cell">Score</div>
                  <div className="table-cell">Date</div>
                  <div className="table-cell">Status</div>
                </div>
                {quizHistory.map((quiz) => (
                  <div key={quiz._id} className="table-row">
                    <div className="table-cell">
                      <span className="quiz-name">{quiz.quizId?.title || 'N/A'}</span>
                    </div>
                    <div className="table-cell">
                      <span className="quiz-score">{quiz.percentage}%</span>
                    </div>
                    <div className="table-cell">
                      <span className="quiz-date">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="table-cell">
                      <span className={`status-badge ${quiz.percentage >= 70 ? 'passed' : 'failed'}`}>
                        {quiz.percentage >= 70 ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No quiz history yet</h3>
                <p>Take your first quiz to test your knowledge</p>
                <Link to="/quizzes" className="btn-browse">Take a Quiz</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
