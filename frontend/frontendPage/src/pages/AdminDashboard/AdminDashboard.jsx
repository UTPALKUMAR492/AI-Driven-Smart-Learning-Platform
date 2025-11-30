import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { createCourse, createQuiz, getDashboardStats, getAllUsers, deleteUser, getAnalytics } from '../../api/adminApi'
import { getAllCourses } from '../../api/courseApi'
import Loader from '../../components/Loader/Loader'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Course form state
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    level: 'Beginner',
    category: 'Development',
    language: 'English',
    price: { amount: 0, currency: 'USD', discount: 0 },
    thumbnail: '',
    requirements: [''],
    whatYouWillLearn: [''],
    lessons: []
  })

  // Quiz form state
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    courseId: '',
    difficulty: 'Beginner',
    duration: 30,
    questions: []
  })

  // Current question being added
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  })

  // Current lesson being added
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0,
    isFree: false
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, coursesData, analyticsData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAllUsers().catch(() => ({ users: [] })),
        getAllCourses().catch(() => ({ courses: [] })),
        getAnalytics().catch(() => null)
      ])
      
      setStats(statsData || {
        totalUsers: 0,
        totalCourses: 0,
        totalQuizzes: 0,
        totalEnrollments: 0,
        revenue: 0
      })
      setUsers(usersData?.users || usersData || [])
      setCourses(coursesData?.courses || coursesData || [])
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    if (!courseData.title || !courseData.description) {
      return toast.error('Please fill all required fields')
    }

    setLoading(true)
    try {
      await createCourse({
        ...courseData,
        requirements: courseData.requirements.filter(r => r.trim()),
        whatYouWillLearn: courseData.whatYouWillLearn.filter(w => w.trim())
      })
      toast.success('Course created successfully! 🎉')
      setCourseData({
        title: '',
        description: '',
        level: 'Beginner',
        category: 'Development',
        language: 'English',
        price: { amount: 0, currency: 'USD', discount: 0 },
        thumbnail: '',
        requirements: [''],
        whatYouWillLearn: [''],
        lessons: []
      })
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizSubmit = async (e) => {
    e.preventDefault()
    if (!quizData.title || quizData.questions.length === 0) {
      return toast.error('Please add title and at least one question')
    }

    setLoading(true)
    try {
      await createQuiz(quizData)
      toast.success('Quiz created successfully! 🎉')
      setQuizData({
        title: '',
        description: '',
        courseId: '',
        difficulty: 'Beginner',
        duration: 30,
        questions: []
      })
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    
    try {
      await deleteUser(userId)
      toast.success('User deleted successfully')
      setUsers(users.filter(u => u._id !== userId))
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt) || !currentQuestion.correctAnswer) {
      return toast.error('Please fill all question fields')
    }

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }))

    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    })

    toast.success('Question added!')
  }

  const removeQuestion = (index) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestionOption = (index, value) => {
    const newOptions = [...currentQuestion.options]
    newOptions[index] = value
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }))
  }

  const addLesson = () => {
    if (!currentLesson.title) {
      return toast.error('Please enter lesson title')
    }

    setCourseData(prev => ({
      ...prev,
      lessons: [...prev.lessons, { ...currentLesson }]
    }))

    setCurrentLesson({
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      isFree: false
    })

    toast.success('Lesson added!')
  }

  const removeLesson = (index) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index)
    }))
  }

  const addRequirement = () => {
    setCourseData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }))
  }

  const updateRequirement = (index, value) => {
    const newReqs = [...courseData.requirements]
    newReqs[index] = value
    setCourseData(prev => ({ ...prev, requirements: newReqs }))
  }

  const removeRequirement = (index) => {
    setCourseData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addLearningPoint = () => {
    setCourseData(prev => ({
      ...prev,
      whatYouWillLearn: [...prev.whatYouWillLearn, '']
    }))
  }

  const updateLearningPoint = (index, value) => {
    const newPoints = [...courseData.whatYouWillLearn]
    newPoints[index] = value
    setCourseData(prev => ({ ...prev, whatYouWillLearn: newPoints }))
  }

  const removeLearningPoint = (index) => {
    setCourseData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== index)
    }))
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchesFilter = userFilter === 'all' || user.role === userFilter
    return matchesSearch && matchesFilter
  })

  if (loading && !stats) {
    return <Loader />
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header-section">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <p>Manage your learning platform</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="admin-tabs-container">
        <div className="container">
          <div className="admin-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="icon">📊</span>
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="icon">👥</span>
              Users ({users.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              <span className="icon">📚</span>
              Courses ({courses.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'create-course' ? 'active' : ''}`}
              onClick={() => setActiveTab('create-course')}
            >
              <span className="icon">➕</span>
              Create Course
            </button>
            <button
              className={`tab-btn ${activeTab === 'create-quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('create-quiz')}
            >
              <span className="icon">📝</span>
              Create Quiz
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content container">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card users">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats?.totalUsers || users.length}</h3>
                  <p>Total Users</p>
                </div>
                <div className="stat-trend up">+12%</div>
              </div>
              <div className="stat-card courses">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>{stats?.totalCourses || courses.length}</h3>
                  <p>Total Courses</p>
                </div>
                <div className="stat-trend up">+8%</div>
              </div>
              <div className="stat-card enrollments">
                <div className="stat-icon">🎓</div>
                <div className="stat-info">
                  <h3>{stats?.totalEnrollments || 0}</h3>
                  <p>Enrollments</p>
                </div>
                <div className="stat-trend up">+24%</div>
              </div>
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>${stats?.revenue?.toLocaleString() || '0'}</h3>
                  <p>Revenue</p>
                </div>
                <div className="stat-trend up">+18%</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Recent Users</h3>
                  <button className="btn-view-all" onClick={() => setActiveTab('users')}>View All</button>
                </div>
                <div className="users-list">
                  {users.slice(0, 5).map((user) => (
                    <div key={user._id} className="user-item">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff`}
                        alt={user.username}
                        className="user-avatar"
                      />
                      <div className="user-info">
                        <span className="user-name">{user.username}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Recent Courses</h3>
                  <button className="btn-view-all" onClick={() => setActiveTab('courses')}>View All</button>
                </div>
                <div className="courses-list">
                  {courses.slice(0, 5).map((course) => (
                    <div key={course._id} className="course-item">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}
                        alt={course.title}
                        className="course-thumb"
                      />
                      <div className="course-info">
                        <span className="course-title">{course.title}</span>
                        <span className="course-stats">
                          {course.enrolledStudents?.count || 0} students • {course.lessons?.length || 0} lessons
                        </span>
                      </div>
                      <span className="course-price">
                        {course.price?.amount > 0 ? `$${course.price.amount}` : 'Free'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card" onClick={() => setActiveTab('create-course')}>
                  <span className="action-icon">📚</span>
                  <span className="action-title">Create Course</span>
                  <span className="action-desc">Add a new course to your platform</span>
                </button>
                <button className="action-card" onClick={() => setActiveTab('create-quiz')}>
                  <span className="action-icon">📝</span>
                  <span className="action-title">Create Quiz</span>
                  <span className="action-desc">Add interactive assessments</span>
                </button>
                <button className="action-card" onClick={() => setActiveTab('users')}>
                  <span className="action-icon">👤</span>
                  <span className="action-title">Manage Users</span>
                  <span className="action-desc">View and manage user accounts</span>
                </button>
                <button className="action-card" onClick={fetchDashboardData}>
                  <span className="action-icon">🔄</span>
                  <span className="action-title">Refresh Data</span>
                  <span className="action-desc">Sync latest information</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="tab-header">
              <h2>User Management</h2>
              <div className="filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            <div className="users-table">
              <div className="table-header">
                <div className="th">User</div>
                <div className="th">Email</div>
                <div className="th">Role</div>
                <div className="th">Joined</div>
                <div className="th">Actions</div>
              </div>
              {filteredUsers.map((user) => (
                <div key={user._id} className="table-row">
                  <div className="td user-cell">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff`}
                      alt={user.username}
                      className="user-avatar-small"
                    />
                    <span>{user.username}</span>
                  </div>
                  <div className="td">{user.email}</div>
                  <div className="td">
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </div>
                  <div className="td">{new Date(user.createdAt).toLocaleDateString()}</div>
                  <div className="td actions">
                    <button className="btn-action edit" title="Edit">✏️</button>
                    <button
                      className="btn-action delete"
                      title="Delete"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="courses-tab">
            <div className="tab-header">
              <h2>Course Management</h2>
              <button className="btn-primary" onClick={() => setActiveTab('create-course')}>
                + Create Course
              </button>
            </div>

            <div className="courses-table">
              <div className="table-header">
                <div className="th">Course</div>
                <div className="th">Category</div>
                <div className="th">Students</div>
                <div className="th">Price</div>
                <div className="th">Rating</div>
                <div className="th">Actions</div>
              </div>
              {courses.map((course) => (
                <div key={course._id} className="table-row">
                  <div className="td course-cell">
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}
                      alt={course.title}
                      className="course-thumb-small"
                    />
                    <div className="course-details">
                      <span className="course-name">{course.title}</span>
                      <span className="course-lessons">{course.lessons?.length || 0} lessons</span>
                    </div>
                  </div>
                  <div className="td">{course.category || 'General'}</div>
                  <div className="td">{course.enrolledStudents?.count || 0}</div>
                  <div className="td">
                    {course.price?.amount > 0 ? (
                      <span className="price">
                        ${course.price.amount}
                        {course.price.discount > 0 && (
                          <span className="discount">-{course.price.discount}%</span>
                        )}
                      </span>
                    ) : (
                      <span className="price free">Free</span>
                    )}
                  </div>
                  <div className="td">
                    <span className="rating">
                      ⭐ {course.rating?.average?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <div className="td actions">
                    <button className="btn-action view" title="View">👁️</button>
                    <button className="btn-action edit" title="Edit">✏️</button>
                    <button className="btn-action delete" title="Delete">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Course Tab */}
        {activeTab === 'create-course' && (
          <div className="create-course-tab">
            <h2>Create New Course</h2>
            <form onSubmit={handleCourseSubmit} className="course-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Complete React Developer Course"
                      value={courseData.title}
                      onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe what students will learn in this course..."
                      rows="4"
                      value={courseData.description}
                      onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-select"
                      value={courseData.category}
                      onChange={(e) => setCourseData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Development">Development</option>
                      <option value="Business">Business</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="IT & Software">IT & Software</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Personal Development">Personal Development</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Level</label>
                    <select
                      className="form-select"
                      value={courseData.level}
                      onChange={(e) => setCourseData(prev => ({ ...prev, level: e.target.value }))}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      className="form-select"
                      value={courseData.language}
                      onChange={(e) => setCourseData(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Thumbnail URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/image.jpg"
                      value={courseData.thumbnail}
                      onChange={(e) => setCourseData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={courseData.price.amount}
                      onChange={(e) => setCourseData(prev => ({
                        ...prev,
                        price: { ...prev.price, amount: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max="100"
                      value={courseData.price.discount}
                      onChange={(e) => setCourseData(prev => ({
                        ...prev,
                        price: { ...prev.price, discount: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>What You'll Learn</h3>
                {courseData.whatYouWillLearn.map((point, index) => (
                  <div key={index} className="dynamic-field">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Build real-world applications"
                      value={point}
                      onChange={(e) => updateLearningPoint(index, e.target.value)}
                    />
                    <button type="button" className="btn-remove-field" onClick={() => removeLearningPoint(index)}>×</button>
                  </div>
                ))}
                <button type="button" className="btn-add-field" onClick={addLearningPoint}>
                  + Add Learning Point
                </button>
              </div>

              <div className="form-section">
                <h3>Requirements</h3>
                {courseData.requirements.map((req, index) => (
                  <div key={index} className="dynamic-field">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Basic JavaScript knowledge"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                    />
                    <button type="button" className="btn-remove-field" onClick={() => removeRequirement(index)}>×</button>
                  </div>
                ))}
                <button type="button" className="btn-add-field" onClick={addRequirement}>
                  + Add Requirement
                </button>
              </div>

              <div className="form-section">
                <h3>Course Content ({courseData.lessons.length} lessons)</h3>
                <div className="lesson-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Lesson Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Introduction to React"
                        value={currentLesson.title}
                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={currentLesson.duration}
                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Video URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://example.com/video.mp4"
                        value={currentLesson.videoUrl}
                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        className="form-textarea"
                        rows="2"
                        placeholder="Brief description of this lesson..."
                        value={currentLesson.description}
                        onChange={(e) => setCurrentLesson(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={currentLesson.isFree}
                          onChange={(e) => setCurrentLesson(prev => ({ ...prev, isFree: e.target.checked }))}
                        />
                        Free Preview
                      </label>
                    </div>
                  </div>
                  <button type="button" className="btn-add-lesson" onClick={addLesson}>
                    + Add Lesson
                  </button>
                </div>

                {courseData.lessons.length > 0 && (
                  <div className="lessons-list">
                    {courseData.lessons.map((lesson, index) => (
                      <div key={index} className="lesson-item">
                        <span className="lesson-number">{index + 1}</span>
                        <div className="lesson-info">
                          <span className="lesson-title">{lesson.title}</span>
                          <span className="lesson-meta">
                            {lesson.duration} min
                            {lesson.isFree && <span className="free-badge">Free Preview</span>}
                          </span>
                        </div>
                        <button type="button" className="btn-remove" onClick={() => removeLesson(index)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            </form>
          </div>
        )}

        {/* Create Quiz Tab */}
        {activeTab === 'create-quiz' && (
          <div className="create-quiz-tab">
            <h2>Create New Quiz</h2>
            <form onSubmit={handleQuizSubmit} className="quiz-form">
              <div className="form-section">
                <h3>Quiz Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Quiz Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., React Basics Quiz"
                      value={quizData.title}
                      onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      className="form-select"
                      value={quizData.difficulty}
                      onChange={(e) => setQuizData(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Brief description of the quiz..."
                      rows="3"
                      value={quizData.description}
                      onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="180"
                      value={quizData.duration}
                      onChange={(e) => setQuizData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Associated Course</label>
                    <select
                      className="form-select"
                      value={quizData.courseId}
                      onChange={(e) => setQuizData(prev => ({ ...prev, courseId: e.target.value }))}
                    >
                      <option value="">Select a course (optional)</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Questions ({quizData.questions.length})</h3>
                <div className="question-form">
                  <div className="form-group">
                    <label>Question Text</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter your question..."
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                    />
                  </div>
                  <div className="options-grid">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="form-group">
                        <label>Option {String.fromCharCode(65 + index)}</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => updateQuestionOption(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <select
                      className="form-select"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    >
                      <option value="">Select correct answer</option>
                      {currentQuestion.options.map((opt, idx) => (
                        opt && <option key={idx} value={opt}>{String.fromCharCode(65 + idx)}: {opt}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="btn-add-question" onClick={addQuestion}>
                    + Add Question
                  </button>
                </div>

                {quizData.questions.length > 0 && (
                  <div className="questions-list">
                    {quizData.questions.map((q, index) => (
                      <div key={index} className="question-item">
                        <div className="question-header">
                          <span className="question-number">Q{index + 1}</span>
                          <button type="button" className="btn-remove" onClick={() => removeQuestion(index)}>×</button>
                        </div>
                        <p className="question-text">{q.text}</p>
                        <div className="question-options">
                          {q.options.map((opt, idx) => (
                            <span
                              key={idx}
                              className={`option-badge ${opt === q.correctAnswer ? 'correct' : ''}`}
                            >
                              {String.fromCharCode(65 + idx)}: {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={loading || quizData.questions.length === 0}>
                {loading ? 'Creating Quiz...' : `Create Quiz (${quizData.questions.length} questions)`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
