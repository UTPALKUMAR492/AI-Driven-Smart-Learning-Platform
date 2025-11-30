import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AuthContext } from '../../context/AuthContext'
import {
  getTeacherStats,
  getTeacherCourses,
  getTeacherQuizzes,
  getTeacherStudents,
  toggleCoursePublish,
  toggleQuizPublish,
  createCourse,
  deleteCourse,
  createQuiz,
  deleteQuiz
} from '../../api/teacherApi'
import Loader from '../../components/Loader/Loader'
import './TeacherDashboard.css'

export default function TeacherDashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [courses, setCourses] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [students, setStudents] = useState([])

  // Course form state
  const [showCourseForm, setShowCourseForm] = useState(false)
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
  const [showQuizForm, setShowQuizForm] = useState(false)
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
    // Skip if user is not loaded yet (handled by ProtectedRoute)
    if (!user) return
    
    // Role check is already handled by ProtectedRoute, just fetch data
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, coursesData, quizzesData, studentsData] = await Promise.all([
        getTeacherStats().catch(() => null),
        getTeacherCourses().catch(() => []),
        getTeacherQuizzes().catch(() => []),
        getTeacherStudents().catch(() => [])
      ])

      setStats(statsData || {
        totalCourses: 0,
        publishedCourses: 0,
        totalQuizzes: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0
      })
      setCourses(coursesData || [])
      setQuizzes(quizzesData || [])
      setStudents(studentsData || [])
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

    try {
      await createCourse({
        ...courseData,
        requirements: courseData.requirements.filter(r => r.trim()),
        whatYouWillLearn: courseData.whatYouWillLearn.filter(w => w.trim())
      })
      toast.success('Course created successfully! 🎉')
      setShowCourseForm(false)
      resetCourseForm()
      fetchDashboardData()
    } catch (error) {
      toast.error(error.message || 'Failed to create course')
    }
  }

  const handleQuizSubmit = async (e) => {
    e.preventDefault()
    if (!quizData.title || quizData.questions.length === 0) {
      return toast.error('Please add title and at least one question')
    }

    try {
      await createQuiz(quizData)
      toast.success('Quiz created successfully! 🎉')
      setShowQuizForm(false)
      resetQuizForm()
      fetchDashboardData()
    } catch (error) {
      toast.error(error.message || 'Failed to create quiz')
    }
  }

  const handleTogglePublish = async (courseId) => {
    try {
      const result = await toggleCoursePublish(courseId)
      toast.success(result.message)
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to update course')
    }
  }

  const handleToggleQuizPublish = async (quizId) => {
    try {
      const result = await toggleQuizPublish(quizId)
      toast.success(result.message)
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to update quiz')
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return
    try {
      await deleteCourse(courseId)
      toast.success('Course deleted')
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return
    try {
      await deleteQuiz(quizId)
      toast.success('Quiz deleted')
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to delete quiz')
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
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: '' })
    toast.success('Question added!')
  }

  const removeQuestion = (index) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const addLesson = () => {
    if (!currentLesson.title) {
      return toast.error('Please enter lesson title')
    }
    setCourseData(prev => ({
      ...prev,
      lessons: [...prev.lessons, { ...currentLesson }]
    }))
    setCurrentLesson({ title: '', description: '', videoUrl: '', duration: 0, isFree: false })
    toast.success('Lesson added!')
  }

  const removeLesson = (index) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index)
    }))
  }

  const resetCourseForm = () => {
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
  }

  const resetQuizForm = () => {
    setQuizData({
      title: '',
      description: '',
      courseId: '',
      difficulty: 'Beginner',
      duration: 30,
      questions: []
    })
  }

  if (loading) return <Loader />

  return (
    <div className="teacher-dashboard">
      {/* Header */}
      <div className="teacher-header-section">
        <div className="container">
          <div className="header-content">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Teacher'}&background=667eea&color=fff&size=200`}
              alt={user?.name}
              className="user-avatar"
            />
            <div className="user-info">
              <h1>Teacher Dashboard</h1>
              <p>Welcome back, {user?.name || 'Teacher'}!</p>
            </div>
          </div>
          <div className="dashboard-tabs">
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              📊 Overview
            </button>
            <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
              📚 My Courses ({courses.length})
            </button>
            <button className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
              📝 My Quizzes ({quizzes.length})
            </button>
            <button className={`tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
              👥 Students ({students.length})
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-container container">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon courses">📚</div>
                <div className="stat-info">
                  <h3>{stats?.totalCourses || 0}</h3>
                  <p>Total Courses</p>
                </div>
                <span className="stat-badge">{stats?.publishedCourses || 0} Published</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon quizzes">📝</div>
                <div className="stat-info">
                  <h3>{stats?.totalQuizzes || 0}</h3>
                  <p>Total Quizzes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon students">👥</div>
                <div className="stat-info">
                  <h3>{stats?.totalStudents || 0}</h3>
                  <p>Total Students</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon revenue">💰</div>
                <div className="stat-info">
                  <h3>${stats?.totalRevenue?.toLocaleString() || 0}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon rating">⭐</div>
                <div className="stat-info">
                  <h3>{stats?.averageRating || 0}</h3>
                  <p>Average Rating</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon attempts">🎯</div>
                <div className="stat-info">
                  <h3>{stats?.quizAttempts || 0}</h3>
                  <p>Quiz Attempts</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card" onClick={() => { setActiveTab('courses'); setShowCourseForm(true); }}>
                  <span className="action-icon">➕</span>
                  <span className="action-title">Create Course</span>
                  <span className="action-desc">Add a new course</span>
                </button>
                <button className="action-card" onClick={() => { setActiveTab('quizzes'); setShowQuizForm(true); }}>
                  <span className="action-icon">📝</span>
                  <span className="action-title">Create Quiz</span>
                  <span className="action-desc">Add a new quiz</span>
                </button>
                <button className="action-card" onClick={() => setActiveTab('students')}>
                  <span className="action-icon">👥</span>
                  <span className="action-title">View Students</span>
                  <span className="action-desc">See enrolled students</span>
                </button>
                <button className="action-card" onClick={fetchDashboardData}>
                  <span className="action-icon">🔄</span>
                  <span className="action-title">Refresh Data</span>
                  <span className="action-desc">Sync latest info</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="courses-tab">
            <div className="tab-header">
              <h2>My Courses</h2>
              <button className="btn-primary" onClick={() => setShowCourseForm(true)}>
                + Create Course
              </button>
            </div>

            {showCourseForm && (
              <div className="form-section">
                <div className="form-header">
                  <h3>Create New Course</h3>
                  <button className="btn-close" onClick={() => setShowCourseForm(false)}>×</button>
                </div>
                <form onSubmit={handleCourseSubmit} className="course-form">
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
                        placeholder="Describe what students will learn..."
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

                  {/* Lessons Section */}
                  <div className="lessons-section">
                    <h4>Course Content ({courseData.lessons.length} lessons)</h4>
                    <div className="lesson-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Lesson Title</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Introduction"
                            value={currentLesson.title}
                            onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Duration (min)</label>
                          <input
                            type="number"
                            className="form-input"
                            min="0"
                            value={currentLesson.duration}
                            onChange={(e) => setCurrentLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Video URL</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://example.com/video.mp4"
                            value={currentLesson.videoUrl}
                            onChange={(e) => setCurrentLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
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
                      <button type="button" className="btn-add" onClick={addLesson}>+ Add Lesson</button>
                    </div>
                    {courseData.lessons.length > 0 && (
                      <div className="lessons-list">
                        {courseData.lessons.map((lesson, index) => (
                          <div key={index} className="lesson-item">
                            <span className="lesson-number">{index + 1}</span>
                            <span className="lesson-title">{lesson.title}</span>
                            <span className="lesson-duration">{lesson.duration} min</span>
                            {lesson.isFree && <span className="free-badge">Free</span>}
                            <button type="button" className="btn-remove" onClick={() => removeLesson(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-submit">Create Course</button>
                </form>
              </div>
            )}

            {/* Courses List */}
            <div className="courses-table">
              <div className="table-header">
                <div className="th">Course</div>
                <div className="th">Students</div>
                <div className="th">Rating</div>
                <div className="th">Status</div>
                <div className="th">Actions</div>
              </div>
              {courses.length > 0 ? courses.map((course) => (
                <div key={course._id} className="table-row">
                  <div className="td course-cell">
                    <img src={course.thumbnail || 'https://via.placeholder.com/60x40'} alt={course.title} className="course-thumb" />
                    <div className="course-info">
                      <span className="course-name">{course.title}</span>
                      <span className="course-meta">{course.lessons?.length || 0} lessons • {course.level}</span>
                    </div>
                  </div>
                  <div className="td">{course.studentsEnrolled || 0}</div>
                  <div className="td">⭐ {course.rating?.toFixed(1) || '0.0'}</div>
                  <div className="td">
                    <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="td actions">
                    <button className="btn-action" title="Toggle Publish" onClick={() => handleTogglePublish(course._id)}>
                      {course.isPublished ? '📤' : '📥'}
                    </button>
                    <button className="btn-action" title="View" onClick={() => navigate(`/courses/${course._id}`)}>👁️</button>
                    <button className="btn-action delete" title="Delete" onClick={() => handleDeleteCourse(course._id)}>🗑️</button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>No courses yet. Create your first course!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="quizzes-tab">
            <div className="tab-header">
              <h2>My Quizzes</h2>
              <button className="btn-primary" onClick={() => setShowQuizForm(true)}>
                + Create Quiz
              </button>
            </div>

            {showQuizForm && (
              <div className="form-section">
                <div className="form-header">
                  <h3>Create New Quiz</h3>
                  <button className="btn-close" onClick={() => setShowQuizForm(false)}>×</button>
                </div>
                <form onSubmit={handleQuizSubmit} className="quiz-form">
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

                  {/* Questions Section */}
                  <div className="questions-section">
                    <h4>Questions ({quizData.questions.length})</h4>
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
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options]
                                newOptions[index] = e.target.value
                                setCurrentQuestion(prev => ({ ...prev, options: newOptions }))
                              }}
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
                      <button type="button" className="btn-add" onClick={addQuestion}>+ Add Question</button>
                    </div>

                    {quizData.questions.length > 0 && (
                      <div className="questions-list">
                        {quizData.questions.map((q, index) => (
                          <div key={index} className="question-item">
                            <span className="question-number">Q{index + 1}</span>
                            <span className="question-text">{q.text}</span>
                            <button type="button" className="btn-remove" onClick={() => removeQuestion(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-submit" disabled={quizData.questions.length === 0}>
                    Create Quiz ({quizData.questions.length} questions)
                  </button>
                </form>
              </div>
            )}

            {/* Quizzes List */}
            <div className="quizzes-table">
              <div className="table-header">
                <div className="th">Quiz</div>
                <div className="th">Course</div>
                <div className="th">Questions</div>
                <div className="th">Status</div>
                <div className="th">Actions</div>
              </div>
              {quizzes.length > 0 ? quizzes.map((quiz) => (
                <div key={quiz._id} className="table-row">
                  <div className="td">
                    <span className="quiz-name">{quiz.title}</span>
                    <span className="quiz-difficulty">{quiz.difficulty}</span>
                  </div>
                  <div className="td">{quiz.courseId?.title || 'None'}</div>
                  <div className="td">{quiz.questions?.length || 0}</div>
                  <div className="td">
                    <span className={`status-badge ${quiz.isPublished ? 'published' : 'draft'}`}>
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="td actions">
                    <button className="btn-action" title="Toggle Publish" onClick={() => handleToggleQuizPublish(quiz._id)}>
                      {quiz.isPublished ? '📤' : '📥'}
                    </button>
                    <button className="btn-action delete" title="Delete" onClick={() => handleDeleteQuiz(quiz._id)}>🗑️</button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>No quizzes yet. Create your first quiz!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="students-tab">
            <div className="tab-header">
              <h2>Enrolled Students</h2>
            </div>
            <div className="students-table">
              <div className="table-header">
                <div className="th">Student</div>
                <div className="th">Email</div>
                <div className="th">Enrolled Courses</div>
                <div className="th">Joined</div>
              </div>
              {students.length > 0 ? students.map((student) => (
                <div key={student._id} className="table-row">
                  <div className="td student-cell">
                    <img
                      src={student.avatar || `https://ui-avatars.com/api/?name=${student.name}&background=667eea&color=fff`}
                      alt={student.name}
                      className="student-avatar"
                    />
                    <span>{student.name}</span>
                  </div>
                  <div className="td">{student.email}</div>
                  <div className="td">{student.enrolledCourses || 0} courses</div>
                  <div className="td">{new Date(student.joinedAt).toLocaleDateString()}</div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>No students enrolled yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
