import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { createCourse, createQuiz, getDashboardStats, getAllUsers, deleteUser, getAnalytics, updateUserRole, getAllCourses as adminGetAllCourses, toggleCoursePublish, deleteCourse as adminDeleteCourse, generateQuestionsAIAdmin, getAllQuizzes, deleteQuiz as adminDeleteQuiz, getQuizResultsAdmin, updateCourse } from '../../api/adminApi'
import { getAllCourses } from '../../api/courseApi'
import Loader from '../../components/Loader/Loader'
import api from '../../api/axiosConfig'
import './AdminDashboard.css'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [resultsModalOpen, setResultsModalOpen] = useState(false)
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('')
  const [pendingCourses, setPendingCourses] = useState([])
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [questionBank, setQuestionBank] = useState([])
  const navigate = useNavigate()
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingRoleFor, setUpdatingRoleFor] = useState(null)

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
    questions: [],
    isPublished: false
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

  // AI Question Generation Dialog State
  const [showAIGen, setShowAIGen] = useState(false)
  const [aiGenTopic, setAIGenTopic] = useState('')
  const [aiGenCourseId, setAIGenCourseId] = useState('')
  const [aiGenNum, setAIGenNum] = useState(10)
  const [aiGenLoading, setAIGenLoading] = useState(false)

  // Handle AI Question Generation
  const handleAIGenerate = async (e) => {
    e.preventDefault()
    if (!aiGenCourseId || !aiGenTopic) return toast.error('Select course and enter topic')
    setAIGenLoading(true)
    try {
      const { questions } = await generateQuestionsAIAdmin({ courseId: aiGenCourseId, topic: aiGenTopic, numQuestions: aiGenNum })
      toast.success(`Generated ${questions.length} questions!`)
      setShowAIGen(false)
      setAIGenTopic('')
      setAIGenCourseId('')
      setAIGenNum(10)
      fetchDashboardData()
    } catch (err) {
      toast.error(err.message || 'AI question generation failed')
    } finally {
      setAIGenLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchRecentQuestions = async () => {
    try {
      const res = await api.get('/questions/recent?limit=50')
      setQuestionBank(res.data.questions || [])
    } catch (e) {
      console.warn('Failed to load recent questions', e)
      setQuestionBank([])
    }
  }

  const editQuestionLocally = (id) => {
    const q = questionBank.find(x => x._id === id)
    if (!q) return toast.error('Question not found')
    const newText = window.prompt('Edit question text', q.text || '')
    if (newText === null) return
    const optsCsv = window.prompt('Enter options separated by | (pipe)', (q.options || []).join(' | '))
    if (optsCsv === null) return
    const opts = optsCsv.split('|').map(s => s.trim()).filter(Boolean)
    const correct = window.prompt('Enter correct option letter (A/B/C/D)', (() => {
      const idx = (q.options||[]).findIndex(o => o === q.correctAnswer)
      return idx >= 0 ? String.fromCharCode(65+idx) : 'A'
    })())
    if (correct === null) return
    const correctIdx = ['A','B','C','D'].indexOf(String(correct).toUpperCase())
    const updated = questionBank.map(x => x._id === id ? { ...x, text: newText, options: opts, correctAnswer: opts[correctIdx] || opts[0] || '' } : x)
    setQuestionBank(updated)
    toast.success('Question updated locally')
  }

  const renderOptionsList = (q) => (
    <ul style={{ margin: '6px 0 0 0', paddingLeft: 18 }}>
      {(q.options || []).slice(0,4).map((opt, i) => (
        <li key={i} style={{ color: q.correctAnswer === opt ? '#0b7' : '#333' }}>
          <strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + i)}.</strong>{opt}
        </li>
      ))}
    </ul>
  )

  const normalizePrice = (course) => {
    if (!course) return { amount: 0, currency: 'USD', discount: 0 };
    if (typeof course.price === 'number') return { amount: course.price, currency: course.currency || 'USD', discount: 0 };
    const p = course.price || {};
    return { amount: p.amount || 0, currency: p.currency || 'USD', discount: p.discount || 0 };
  }

  const getEnrolledCount = (course) => {
    if (!course) return 0
    return course.enrolledStudents?.count ?? course.studentsEnrolled ?? 0
  }

  const getRatingValue = (course) => {
    if (!course) return 0
    if (typeof course.rating === 'number') return course.rating
    if (course.rating?.average) return course.rating.average
    return 0
  }

  const getCourseLessonsCount = (course) => {
    if (!course) return 0
    // Prefer explicit totalLessons if present
    if (typeof course.totalLessons === 'number' && course.totalLessons > 0) return course.totalLessons
    // If sections exist, sum lessons across sections
    if (Array.isArray(course.sections) && course.sections.length > 0) {
      return course.sections.reduce((sum, sec) => sum + (Array.isArray(sec.lessons) ? sec.lessons.length : 0), 0)
    }
    // Fallback to legacy lessons array
    if (Array.isArray(course.lessons)) return course.lessons.length
    return 0
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, coursesData, analyticsData, quizzesData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getAllUsers().catch(() => ({ users: [] })),
        adminGetAllCourses().catch(() => ({ courses: [] })),
        getAnalytics().catch(() => null),
        getAllQuizzes().catch(() => ({ quizzes: [] }))
      ])
      
      setStats(statsData?.stats || {
        totalUsers: 0,
        totalCourses: 0,
        totalQuizzes: 0,
        totalEnrollments: 0,
        revenue: 0
      })
      setUsers(usersData?.users || usersData || [])
      setCourses(coursesData?.courses || coursesData || [])
      setQuizzes(quizzesData?.quizzes || quizzesData || [])
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch pending courses for Approval Queue
  const fetchPending = async () => {
    try {
      const data = await adminGetAllCourses({ isPublished: 'false', limit: 50 });
      setPendingCourses(data.courses || []);
    } catch (err) {
      console.error('Could not load pending courses', err);
    }
  }

  useEffect(() => {
    // load pending when admin opens approval queue
    if (activeTab === 'approval') fetchPending();
  }, [activeTab])

  const handleApprove = async (courseId) => {
    try {
      await toggleCoursePublish(courseId)
      toast.success('Course approved and published')
      fetchDashboardData()
      fetchPending()
    } catch (err) {
      toast.error('Could not approve course')
    }
  }

  const handleReject = async (courseId) => {
    if (!window.confirm('Rejecting will delete the course. Continue?')) return
    try {
      await adminDeleteCourse(courseId)
      toast.success('Course rejected and deleted')
      fetchPending()
      fetchDashboardData()
    } catch (err) {
      toast.error('Could not reject course')
    }
  }

  const handlePublish = async (courseId, publish = true) => {
    try {
      await toggleCoursePublish(courseId, publish)
      toast.success(publish ? 'Course published' : 'Course unpublished')
      fetchDashboardData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update publish status')
    }
  }

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`)
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course?')) return
    try {
      await adminDeleteCourse(courseId)
      toast.success('Course deleted')
      fetchDashboardData()
    } catch (err) {
      toast.error('Could not delete course')
    }
  }

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    if (!courseData.title || !courseData.description) {
      return toast.error('Please fill all required fields')
    }

    setLoading(true)
    try {
      if (isEditingCourse && editingCourseId) {
        await updateCourse(editingCourseId, {
          ...courseData,
          requirements: courseData.requirements.filter(r => r.trim()),
          whatYouWillLearn: courseData.whatYouWillLearn.filter(w => w.trim())
          // quizzes assigned above
        })
        toast.success('Course updated successfully')
        setIsEditingCourse(false)
        setEditingCourseId(null)
      } else {
        const payload = {
          ...courseData,
          price: typeof courseData.price === 'object' ? (courseData.price.amount || 0) : (courseData.price || 0),
          requirements: courseData.requirements.filter(r => r.trim()),
          whatYouWillLearn: courseData.whatYouWillLearn.filter(w => w.trim())
        }
        await createCourse(payload)
        toast.success('Course created successfully! 🎉')
      }
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

  const openEditCourse = (course) => {
    setIsEditingCourse(true)
    setEditingCourseId(course._id)
    setCourseData({
      title: course.title || '',
      description: course.description || '',
      level: course.level || 'Beginner',
      category: course.category || 'Development',
      language: course.language || 'English',
      price: typeof course.price === 'number' ? { amount: course.price, currency: course.currency || 'USD', discount: 0 } : (course.price || { amount: 0, currency: 'USD', discount: 0 }),
      thumbnail: course.thumbnail || '',
      requirements: course.requirements || [''],
      whatYouWillLearn: course.whatYouWillLearn || [''],
      lessons: course.sections?.[0]?.lessons?.map(l => ({ title: l.title, description: l.content || '', videoUrl: l.content || '', duration: l.duration || 0, isFree: l.isPreview })) || (course.lessons || [])
    })
    setActiveTab('create-course')
    window.scrollTo(0,0)
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
        questions: [],
        isPublished: false
      })
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  // Load question bank when course is selected for quiz
  useEffect(() => {
    const loadBank = async () => {
      if (!quizData.courseId) return setQuestionBank([])
      try {
        const res = await api.get(`/questions/course/${quizData.courseId}`)
        let bank = res.data.questions || []
        // if no course-specific questions, fetch recent questions as fallback
        if (!bank || bank.length === 0) {
          try {
            const recentRes = await api.get('/questions/recent?limit=50')
            bank = recentRes.data.questions || []
          } catch (e) {
            console.warn('Failed to load recent questions fallback', e)
          }
        }
        setQuestionBank(bank)
      } catch (err) {
        console.error('Failed to load question bank', err)
        setQuestionBank([])
      }
    }
    loadBank()
  }, [quizData.courseId])

  const importQuestionToQuiz = (q) => {
    setQuizData(prev => ({ ...prev, questions: [...prev.questions, { text: q.text, options: q.options, correctAnswer: q.correctAnswer }] }))
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

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!['student','teacher','admin'].includes(newRole)) return toast.error('Invalid role')
    console.log('Updating role for', userId, '->', newRole)
    setUpdatingRoleFor(userId)
    try {
      const updated = await updateUserRole(userId, newRole)
      console.log('Update role response', updated)
      toast.success('User role updated')
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: updated.role } : u))
    } catch (err) {
      console.error('Failed updateUserRole:', err)
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally {
      setUpdatingRoleFor(null)
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
    const matchesSearch = user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchesFilter = userFilter === 'all' || user.role === userFilter
    return matchesSearch && matchesFilter
  })

  const exportUsersCSV = (rows) => {
    if (!rows || rows.length === 0) return toast.info('No users to export')
    const headers = ['name','email','role','joinedAt']
    const csv = [headers.join(',')].concat(rows.map(u => [ '"'+(u.name||'')+'"', u.email || '', u.role || '', '"'+new Date(u.createdAt).toISOString()+'"' ].join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_export.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading && !stats) {
    return <Loader />
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header-section">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage your learning platform</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="ai-gen-btn" onClick={() => setShowAIGen(true)} style={{ background: '#4A6CF7', color: '#fff', borderRadius: 4, padding: '6px 14px', marginLeft: 8 }}>
              🤖 AI Generate Questions
            </button>
            <button
              className={`refresh-btn ${loading ? 'spin' : ''}`}
              onClick={() => fetchDashboardData()}
              disabled={loading}
              title="Refresh dashboard"
            >
              <span className="refresh-icon">🔄</span>
              <span style={{ marginLeft: 8 }}>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Generate Questions Dialog */}
      {showAIGen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>AI Generate Questions</h3>
            <form onSubmit={handleAIGenerate}>
              <label>Course:
                <select value={aiGenCourseId} onChange={e => setAIGenCourseId(e.target.value)} required>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </label>
              <label>Topic or Paper Description:
                <textarea value={aiGenTopic} onChange={e => setAIGenTopic(e.target.value)} required rows={3} />
              </label>
              <label>Number of Questions:
                <input type="number" min={1} max={30} value={aiGenNum} onChange={e => setAIGenNum(Number(e.target.value))} />
              </label>
              <div className="modal-actions">
                <button type="submit" disabled={aiGenLoading}>{aiGenLoading ? 'Generating...' : 'Generate & Save'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAIGen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => { setActiveTab('questions'); fetchRecentQuestions(); }}
            >
              <span className="icon">❓</span>
              Questions
            </button>
            {user?.role !== 'admin' ? (
              <>
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
              </>
            ) : null}
            <button
              className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              <span className="icon">🏷️</span>
              Quizzes
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
                  <h3>₹ {stats?.revenue?.toLocaleString() || '0'}</h3>
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
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=667eea&color=fff`}
                        alt={user.name}
                        className="user-avatar"
                      />
                      <div className="user-meta">
                        <span className="user-name">{user.name}</span>
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
                          {getEnrolledCount(course)} students • {getCourseLessonsCount(course)} lessons
                        </span>
                      </div>
                      <span className="course-price">
                        {normalizePrice(course).amount > 0 ? `₹ ${normalizePrice(course).amount}` : 'Free'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Generated / Recent Questions</h3>
                  <button className="btn-view-all" onClick={() => { setActiveTab('questions'); fetchRecentQuestions(); }}>View All</button>
                </div>
                <div className="questions-list">
                  {questionBank.slice(0,5).map((q) => (
                    <div key={q._id} className="question-item">
                      <div style={{ flex: 1 }}>
                        <strong>{q.text}</strong>
                        {renderOptionsList(q)}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-add" onClick={() => {
                          // Import into quiz creation area
                          setActiveTab('create-quiz');
                          // prefill a single-question quiz draft
                          setQuizData(prev => ({ ...prev, questions: [...prev.questions, { text: q.text, options: q.options, correctAnswer: q.correctAnswer }] }));
                          toast.success('Imported question into quiz draft')
                        }}>Add</button>
                        <button className="btn-secondary" onClick={() => editQuestionLocally(q._id)}>Edit</button>
                        {!q.published && (
                          <button className="btn-primary" onClick={async () => {
                            try {
                              const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/questions/${q._id}/publish`, { method: 'POST', credentials: 'include', headers: { Authorization: (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '') } })
                              if (!res.ok) throw new Error('Publish failed')
                              toast.success('Question published')
                              fetchRecentQuestions()
                            } catch (err) { toast.error('Could not publish question') }
                          }}>Publish</button>
                        )}
                        <button className="btn-danger" onClick={async () => {
                          if (!window.confirm('Delete this question?')) return
                          try {
                            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/questions/${q._id}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '') } })
                            if (!res.ok) throw new Error('Delete failed')
                            toast.success('Question deleted')
                            fetchRecentQuestions()
                          } catch (err) { toast.error('Could not delete question') }
                        }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              {/* <h3>Quick Actions</h3> */}
              <div className="actions-grid">
                {/* <button className="action-card" onClick={() => setActiveTab('users')}>
                  <span className="action-icon">👤</span>
                  <span className="action-title">Manage Users</span>
                  <span className="action-desc">View and manage user accounts</span>
                </button> */}
              </div>
            </div> 
          </div>
        )} 

        {/* Results Modal (admin quizzes) */}
        {resultsModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{selectedQuizTitle}</h3>
                <button className="btn-close" onClick={() => setResultsModalOpen(false)}>×</button>
              </div>
              <div style={{ marginTop: 12 }}>
                {quizResults.length === 0 ? (
                  <div>No results yet.</div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      <button className="btn-primary" onClick={() => {
                        // export CSV
                        const headers = ['rank','name','email','score','total','percentage','completedAt']
                        const csv = [headers.join(',')].concat(quizResults.map(r => [r.rank, '"'+(r.user?.name||'')+'"', r.user?.email || '', r.score, r.total, r.percentage, '"'+new Date(r.completedAt).toISOString()+'"'].join(','))).join('\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${selectedQuizTitle.replace(/\s+/g,'_') || 'quiz'}_results.csv`
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                        URL.revokeObjectURL(url)
                      }}>Export CSV</button>
                    </div>
                    <div className="results-list">
                      <div className="table-header">
                        <div className="th">Rank</div>
                        <div className="th">Student</div>
                        <div className="th">Score</div>
                        <div className="th">%</div>
                        <div className="th">Completed</div>
                      </div>
                      {quizResults.map(r => (
                        <div key={r._id} className="table-row">
                          <div className="td">{r.rank}</div>
                          <div className="td user-cell">
                            <img src={r.user?.avatar || `https://ui-avatars.com/api/?name=${r.user?.name}&background=667eea&color=fff`} alt={r.user?.name} className="user-avatar-small" />
                            <span>{r.user?.name}</span>
                          </div>
                          <div className="td">{r.score} / {r.total}</div>
                          <div className="td">{r.percentage}%</div>
                          <div className="td">{new Date(r.completedAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questions management tab */}
        {activeTab === 'questions' && (
          <div className="questions-tab">
            <div className="tab-header">
              <h2>Questions</h2>
            </div>
            <div className="questions-list full">
              {questionBank.length === 0 ? (
                <div className="empty">No generated questions found.</div>
              ) : (
                questionBank.map(q => (
                  <div key={q._id} className="question-item">
                    <div style={{ flex: 1 }}>
                      <strong>{q.text}</strong>
                      {renderOptionsList(q)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-add" onClick={() => {
                        setActiveTab('create-quiz');
                        setQuizData(prev => ({ ...prev, questions: [...prev.questions, { text: q.text, options: q.options, correctAnswer: q.correctAnswer }] }));
                        toast.success('Imported question into quiz draft')
                      }}>Add to Quiz</button>
                      <button className="btn-secondary" onClick={() => editQuestionLocally(q._id)}>Edit</button>
                      {!q.published && (
                        <button className="btn-primary" onClick={async () => {
                          try {
                            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/questions/${q._id}/publish`, { method: 'POST', credentials: 'include', headers: { Authorization: (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '') } })
                            if (!res.ok) throw new Error('Publish failed')
                            toast.success('Question published')
                            fetchRecentQuestions()
                          } catch (err) { toast.error('Could not publish question') }
                        }}>Publish</button>
                      )}
                      <button className="btn-danger" onClick={async () => {
                        if (!window.confirm('Delete this question?')) return
                        try {
                          const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + `/api/questions/${q._id}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: (localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '') } })
                          if (!res.ok) throw new Error('Delete failed')
                          toast.success('Question deleted')
                          fetchRecentQuestions()
                        } catch (err) { toast.error('Could not delete question') }
                      }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* When creating a quiz show question bank import list */}
        {activeTab === 'create-quiz' && questionBank.length > 0 && (
          <div className="form-section">
            <h3>Question Bank (import into quiz)</h3>
            <div className="questions-list">
              {questionBank.map((q) => (
                <div key={q._id} className="question-item">
                  <div style={{ flex: 1 }}>
                    <strong>{q.text}</strong>
                    {renderOptionsList(q)}
                  </div>
                  <div>
                    <button type="button" className="btn-add" onClick={() => importQuestionToQuiz(q)}>Add to Quiz</button>
                  </div>
                </div>
              ))}
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
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
                <button className="btn-outline" onClick={() => exportUsersCSV(filteredUsers)} style={{ marginLeft: 8 }}>Export CSV</button>
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
                       src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=667eea&color=fff`}
                      alt={user.name}
                      className="user-avatar-small"
                    />
                    <span>{user.name}</span>
                  </div>
                  <div className="td">{user.email}</div>
                  <div className="td">
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </div>
                  <div className="td">{new Date(user.createdAt).toLocaleDateString()}</div>
                  <div className="td actions">
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                      title="Change role"
                      disabled={updatingRoleFor === user._id}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
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
                {/* Create course removed for admin role */}
            </div>

            <div className="courses-table">
              <div className="table-header">
                <div className="th">Course</div>
                <div className="th">Category</div>
                <div className="th">Students</div>
                <div className="th">Price</div>
                <div className="th">Revenue</div>
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
                      <span className="course-lessons">{getCourseLessonsCount(course)} lessons</span>
                    </div>
                  </div>
                  <div className="td">{course.category || 'General'}</div>
                  <div className="td">{course.enrolledStudents?.count ?? course.studentsEnrolled ?? course.studentsEnrolled === 0 ? course.studentsEnrolled : 0}</div>
                  <div className="td">
                    {normalizePrice(course).amount > 0 ? (
                      <span className="price">
                        ₹ {normalizePrice(course).amount}
                        {normalizePrice(course).discount > 0 && (
                          <span className="discount">-{normalizePrice(course).discount}%</span>
                        )}
                      </span>
                    ) : (
                      <span className="price free">Free</span>
                    )}
                  </div>
                  <div className="td">{Math.round(normalizePrice(course).amount * getEnrolledCount(course)) > 0 ? `₹ ${Math.round(normalizePrice(course).amount * getEnrolledCount(course))}` : '₹ 0'}</div>
                  <div className="td">
                    <span className="rating">
                      ⭐ {getRatingValue(course).toFixed(1)}
                    </span>
                  </div>
                  <div className="td actions">
                    <button className="btn-action view" title="View" onClick={() => handleViewCourse(course._id)}>👁️</button>
                    {course.isPublished ? (
                      <button className="btn-action" title="Unpublish" onClick={() => handlePublish(course._id, false)}>🔒 Unpublish</button>
                    ) : (
                      <button className="btn-action" title="Publish" onClick={() => handlePublish(course._id, true)}>✅ Publish</button>
                    )}
                    <button className="btn-action delete" title="Delete" onClick={() => handleDeleteCourse(course._id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="quizzes-tab">
            <div className="tab-header">
              <h2>Quiz Management</h2>
            </div>

            <div className="courses-table quizzes-table">
              <div className="table-header">
                <div className="th">Title</div>
                <div className="th">Course</div>
                <div className="th">Questions</div>
                <div className="th">Difficulty</div>
                <div className="th">Duration (min)</div>
                <div className="th">Actions</div>
              </div>
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="table-row">
                  <div className="td">{quiz.title}</div>
                  <div className="td">{quiz.courseId?.title || '—'}</div>
                  <div className="td">{quiz.questions?.length || 0}</div>
                  <div className="td">{quiz.difficulty}</div>
                  <div className="td">{quiz.duration}</div>
                  <div className="td actions">
                    <button className="btn-action view" title="View" onClick={() => navigate(`/admin/quiz/${quiz._id}`)}>👁️</button>
                    <button className="btn-action" title="Results" onClick={async () => {
                      try {
                        const res = await getQuizResultsAdmin(quiz._id)
                        setQuizResults(res || [])
                        setSelectedQuizTitle(quiz.title || 'Quiz Results')
                        setResultsModalOpen(true)
                      } catch (err) {
                        toast.error('Could not load results')
                      }
                    }}>🏆</button>
                    <button className="btn-action delete" title="Delete" onClick={async () => {
                      if (!window.confirm('Delete this quiz?')) return;
                      try {
                        await adminDeleteQuiz(quiz._id);
                        toast.success('Quiz deleted');
                        setQuizzes(prev => prev.filter(q => q._id !== quiz._id));
                      } catch (err) {
                        console.error('Failed to delete quiz', err);
                        toast.error(err?.response?.data?.message || 'Could not delete quiz');
                      }
                    }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval Queue */}
        {activeTab === 'approval' && (
          <div className="approval-tab">
            <div className="tab-header">
              <h2>Approval Queue</h2>
              <p>Courses awaiting admin approval</p>
            </div>
            <div className="pending-list">
              {pendingCourses.length === 0 ? (
                <div className="empty">No pending courses</div>
              ) : (
                pendingCourses.map(course => (
                  <div key={course._id} className="pending-item">
                    <img src={course.thumbnail} alt={course.title} className="pending-thumb" />
                    <div className="pending-meta">
                      <h3>{course.title}</h3>
                      <p>{course.description?.slice(0, 160)}{course.description?.length > 160 ? '...' : ''}</p>
                      <div className="meta-row">
                        <span>By: {course.instructor?.name || course.instructorName}</span>
                        <span>Category: {course.category}</span>
                        <span>Price: {course.price?.amount ? `₹ ${course.price.amount}` : 'Free'}</span>
                      </div>
                    </div>
                    <div className="pending-actions">
                      <button className="btn-approve" onClick={() => handleApprove(course._id)}>Approve</button>
                      <button className="btn-reject" onClick={() => handleReject(course._id)}>Reject</button>
                      <button className="btn-view" onClick={() => setActiveTab('courses')}>Manage</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Create Course Tab */}
        {user?.role !== 'admin' && activeTab === 'create-course' && (
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
                    <label>Price (₹)</label>
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
        {user?.role !== 'admin' && activeTab === 'create-quiz' && (
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
                  <div className="form-group" style={{ alignSelf: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={quizData.isPublished} onChange={(e) => setQuizData(prev => ({ ...prev, isPublished: e.target.checked }))} />
                      <span>Publish now</span>
                    </label>
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
