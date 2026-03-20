import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AuthContext } from '../../context/AuthContext'
import {
  getTeacherStats,
  getTeacherCourses,
  getTeacherQuizzes,
  getTeacherStudents,
  getQuizResults,
  toggleCoursePublish,
  toggleQuizPublish,
  createCourse,
  deleteCourse,
  createQuiz,
  deleteQuiz,
  generateQuestionsAI
} from '../../api/teacherApi'
import api from '../../api/axiosConfig'
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
  const [questionBank, setQuestionBank] = useState([])
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
    lessons: [],
    isPublished: false
  })

  // AI Question Generation Dialog State (MOVED INSIDE COMPONENT)
  const [showAIGen, setShowAIGen] = useState(false);
  const [aiGenTopic, setAIGenTopic] = useState('');
  const [aiGenCourseId, setAIGenCourseId] = useState('');
  const [aiGenNum, setAIGenNum] = useState(10);
  const [aiGenLoading, setAIGenLoading] = useState(false);
  // Handle AI Question Generation
  const handleAIGenerate = async (e) => {
    e.preventDefault()
    if (!aiGenCourseId || !aiGenTopic) return toast.error('Select course and enter topic')
    setAIGenLoading(true)
    try {
      const res = await api.post('/ai/question/generate-questions', { topic: aiGenTopic, courseId: aiGenCourseId, count: aiGenNum })
      const data = res.data || {}
      const questions = data.questions || []
      if (!questions.length) {
        toast.warn(data?.message || 'No valid questions were generated. Try a different prompt or course.')
        return
      }
      toast.success(`Generated ${questions.length} questions`)
      setShowAIGen(false)
      setAIGenTopic('')
      setAIGenCourseId('')
      setAIGenNum(10)
      // refresh dashboard to show any persisted questions
      fetchDashboardData()
    } catch (err) {
      console.error('AI generate error', err)
      toast.error(err?.response?.data?.message || 'AI generation failed')
    } finally {
      setAIGenLoading(false)
    }
  }

  // Quiz form state
  const [showQuizForm, setShowQuizForm] = useState(false)
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

  // Quiz results modal state
  const [quizResults, setQuizResults] = useState([])
  const [resultsModalOpen, setResultsModalOpen] = useState(false)
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('')
  // Inline results panel state
  const [openQuizId, setOpenQuizId] = useState(null)
  const [expandedResults, setExpandedResults] = useState({})
  const [resultDetailsMap, setResultDetailsMap] = useState({})
  const [resultsSortKey, setResultsSortKey] = useState('rank')
  const [resultsSortDir, setResultsSortDir] = useState('asc')
  const [resultsFilterMin, setResultsFilterMin] = useState(0)
  const [resultDetail, setResultDetail] = useState(null)
  const [resultDetailOpen, setResultDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

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
    if (!courseData.title || !courseData.description || !courseData.category) {
      return toast.error('Please fill all required fields (title, description, category)')
    }

    // Ensure required fields and flatten price
    const payload = {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category || 'Development',
      level: courseData.level || 'Beginner',
      language: courseData.language || 'English',
      thumbnail: courseData.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      price: typeof courseData.price === 'object' ? courseData.price.amount || 0 : courseData.price || 0,
      requirements: Array.isArray(courseData.requirements) ? courseData.requirements.filter(r => r.trim()) : [],
      whatYouWillLearn: Array.isArray(courseData.whatYouWillLearn) ? courseData.whatYouWillLearn.filter(w => w.trim()) : [],
      lessons: Array.isArray(courseData.lessons) ? courseData.lessons : [],
      isPublished: !!courseData.isPublished
    }

    try {
      await createCourse(payload)
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

    // Ensure required fields for quiz
    const payload = {
      title: quizData.title,
      description: quizData.description || '',
      courseId: quizData.courseId || '',
      difficulty: quizData.difficulty || 'Beginner',
      duration: quizData.duration || 30,
      questions: Array.isArray(quizData.questions) ? quizData.questions : [],
      isPublished: !!quizData.isPublished
    }

    try {
      await createQuiz(payload)
      toast.success('Quiz created successfully! 🎉')
      setShowQuizForm(false)
      resetQuizForm()
      fetchDashboardData()
    } catch (error) {
      toast.error(error.message || 'Failed to create quiz')
    }
  }

  useEffect(() => {
    const loadBank = async () => {
      if (!quizData.courseId) return setQuestionBank([])
      try {
          const res = await api.get(`/questions/course/${quizData.courseId}`)
          let bank = res.data.questions || []
          if ((!bank || bank.length === 0)) {
            try {
              const recentRes = await api.get('/questions/recent?limit=50')
              bank = recentRes.data.questions || []
            } catch (e) { console.warn('Failed to load recent questions fallback', e) }
          }
          setQuestionBank(bank)
      } catch (err) {
        console.error('Failed to load question bank', err)
        setQuestionBank([])
      }
    }
    loadBank()
  }, [quizData.courseId])

  // Load recent/generated questions for Questions tab
  const fetchRecentQuestions = async () => {
    try {
        const res = await api.get('/questions/recent?limit=50')
        setQuestionBank(res.data.questions || [])
    } catch (e) {
      console.warn('Failed to load recent questions', e)
      setQuestionBank([])
    }
  }

  const importQuestionToQuiz = (q) => {
    setQuizData(prev => ({ ...prev, questions: [...prev.questions, { text: q.text, options: q.options, correctAnswer: q.correctAnswer }] }))
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

  const openResults = async (quiz) => {
    try {
      // toggle: close if same quiz clicked
      if (openQuizId === quiz._id) {
        setOpenQuizId(null)
        setQuizResults([])
        setSelectedQuizTitle('')
        return
      }
      setSelectedQuizTitle(quiz.title || 'Quiz Results')
      const data = await getQuizResults(quiz._id)
      setQuizResults(data || [])
      setOpenQuizId(quiz._id)
    } catch (err) {
      toast.error(err?.message || 'Could not load results')
    }
  }

  const toggleResultExpand = async (resultId) => {
    // if already expanded, collapse
    if (expandedResults[resultId]) {
      setExpandedResults(prev => ({ ...prev, [resultId]: false }))
      return
    }

    // if details already fetched, just expand
    if (resultDetailsMap[resultId]) {
      setExpandedResults(prev => ({ ...prev, [resultId]: true }))
      return
    }

    // fetch detail and expand
    try {
      setDetailLoading(true)
      const res = await getResultDetails(resultId)
      setResultDetailsMap(prev => ({ ...prev, [resultId]: res }))
      setExpandedResults(prev => ({ ...prev, [resultId]: true }))
    } catch (e) {
      console.error('Could not fetch result detail', e)
      toast.error('Could not load result details')
    } finally { setDetailLoading(false) }
  }

  const exportResultsCSV = (rows) => {
    if (!rows || rows.length === 0) return toast.info('No results to export')
    const headers = ['rank','name','email','score','total','percentage','completedAt']
    const csv = [headers.join(',')].concat(rows.map(r => [r.rank, '"'+(r.user?.name||'')+'"', r.user?.email || '', r.score, r.total, r.percentage, '"'+new Date(r.completedAt).toISOString()+'"'].join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedQuizTitle.replace(/\s+/g,'_') || 'quiz'}_results.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const sortedFilteredResults = () => {
    let rows = Array.isArray(quizResults) ? [...quizResults] : []
    // filter
    if (resultsFilterMin) rows = rows.filter(r => (r.percentage || 0) >= Number(resultsFilterMin))
    // sort
    rows.sort((a,b) => {
      const dir = resultsSortDir === 'asc' ? 1 : -1
      if (resultsSortKey === 'percentage') return dir * ((a.percentage||0) - (b.percentage||0))
      if (resultsSortKey === 'score') return dir * ((a.score||0) - (b.score||0))
      if (resultsSortKey === 'name') return dir * ((a.user?.name||'').localeCompare(b.user?.name||''))
      return dir * ((a.rank||0) - (b.rank||0))
    })
    return rows
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
      {/* When creating a quiz show question bank import list */}
      {activeTab === 'quizzes' && questionBank.length > 0 && (
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
      {/* Questions Tab - recent/generated questions */}
      {activeTab === 'questions' && (
        <div className="form-section">
          <h3>Generated / Recent Questions</h3>
          {questionBank.length === 0 ? (
            <div>No generated questions yet.</div>
          ) : (
            <div className="questions-list">
              {questionBank.map((q) => (
                <div key={q._id} className="question-item">
                  <div style={{ flex: 1 }}>
                    <strong>{q.text}</strong>
                    {renderOptionsList(q)}
                    <div style={{ fontSize: 12, color: '#777' }}>Course: {q.course || '—'} • Published: {q.published ? 'Yes' : 'No'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" className="btn-add" onClick={() => importQuestionToQuiz(q)}>Add to Quiz</button>
                    <button type="button" className="btn-secondary" onClick={() => editQuestionLocally(q._id)}>Edit</button>
                    {!q.published && (
                        <button type="button" className="btn-primary" onClick={async () => {
                          try {
                            await api.post(`/questions/${q._id}/publish`)
                            toast.success('Question published')
                            fetchRecentQuestions()
                          } catch (err) { toast.error('Could not publish question') }
                        }}>Publish</button>
                    )}
                    <button type="button" className="btn-danger" onClick={async () => {
                      if (!window.confirm('Delete this question?')) return
                      try {
                          await api.delete(`/questions/${q._id}`)
                          toast.success('Question deleted')
                          fetchRecentQuestions()
                        } catch (err) { toast.error('Could not delete question') }
                    }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
            <button className="ai-gen-btn" onClick={() => setShowAIGen(true)} style={{ float: 'right', background: '#4A6CF7', color: '#fff', borderRadius: 4, padding: '6px 14px', marginLeft: 8 }}>
              🤖 AI Generate Questions
            </button>
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
              📚 My Courses ({courses.length})
            </button>
            <button
              className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => { setActiveTab('questions'); fetchRecentQuestions(); }}
            >
              <span className="icon">❓</span>
              Questions
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
                  <h3>₹ {stats?.totalRevenue?.toLocaleString() || 0}</h3>
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
                    <div className="form-group" style={{ alignSelf: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={courseData.isPublished} onChange={(e) => setCourseData(prev => ({ ...prev, isPublished: e.target.checked }))} />
                        <span>Publish now</span>
                      </label>
                    </div>
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
                          <label>Video</label>
                          <input
                            type="file"
                            accept="video/*"
                            className="form-input"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                                // Client-side size check (500MB)
                                const MAX_VIDEO = 500 * 1024 * 1024;
                                if (file.size > MAX_VIDEO) {
                                  toast.error('Video file too large. Max 500MB allowed.');
                                  return;
                                }
                              const formData = new FormData();
                              formData.append('video', file);
                              try {
                                  const resp = await api.post('/upload/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                                  const data = resp.data
                                  if (data.url) {
                                    setCurrentLesson(prev => ({ ...prev, videoUrl: data.url }));
                                    toast.success('Video uploaded!');
                                  } else {
                                    toast.error(data.message || 'Upload failed');
                                  }
                                } catch (err) {
                                  toast.error('Upload failed');
                                }
                            }}
                          />
                          {currentLesson.videoUrl && (
                            <div style={{ fontSize: '0.9em', color: '#059669', marginTop: 4 }}>Uploaded: {currentLesson.videoUrl}</div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Lesson Notes (text or PDF)</label>
                          <textarea
                            className="form-input"
                            placeholder="Paste lesson notes here or upload a PDF below."
                            value={currentLesson.notes || ''}
                            onChange={e => setCurrentLesson(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                          />
                          <input
                            type="file"
                            accept="application/pdf"
                            className="form-input"
                            style={{ marginTop: 4 }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              // Client-side size check (20MB)
                              const MAX_NOTES = 20 * 1024 * 1024;
                              if (file.size > MAX_NOTES) {
                                toast.error('Notes file too large. Max 20MB allowed.');
                                return;
                              }
                              const formData = new FormData();
                              formData.append('notes', file);
                              try {
                                  const resp = await api.post('/upload/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                                  const data = resp.data
                                  if (data.url) {
                                    setCurrentLesson(prev => ({ ...prev, notes: data.url }));
                                    toast.success('Notes uploaded!');
                                  } else {
                                    toast.error(data.message || 'Upload failed');
                                  }
                                } catch (err) {
                                  toast.error('Upload failed');
                                }
                            }}
                          />
                          {currentLesson.notes && typeof currentLesson.notes === 'string' && currentLesson.notes.endsWith('.pdf') && (
                            <div style={{ fontSize: '0.9em', color: '#059669', marginTop: 4 }}>PDF uploaded: {currentLesson.notes}</div>
                          )}
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
                <div className="th">Category</div>
                <div className="th">Students</div>
                <div className="th">Rating</div>
                    <div className="th">Status</div>
              </div>
              {courses.length > 0 ? courses.map((course) => (
                <div key={course._id} className="table-row">
                  <div className="td course-cell">
                    <img src={course.thumbnail || 'https://via.placeholder.com/60x40'} alt={course.title} className="course-thumb" />
                    <div className="course-info">
                      <span className="course-name">{course.title}</span>
                      <span className="course-meta">{course.totalLessons || course.lessons?.length || 0} lessons • {course.level}</span>
                    </div>
                  </div>
                  <div className="td">{course.category || '-'}</div>
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
                    <button className="btn-action" title="View Results" onClick={() => openResults(quiz)}>🏆</button>
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
        {/* Results Modal */}
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
                    <div style={{ marginBottom: 8, color: '#6b7280' }}>
                      {quizResults[0]?.courseTitle ? (`Course: ${quizResults[0].courseTitle}`) : ''}
                      {quizResults[0]?.courseCategory ? (` • Category: ${quizResults[0].courseCategory}`) : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Sort by:
                        <select value={resultsSortKey} onChange={e => setResultsSortKey(e.target.value)}>
                          <option value="rank">Rank</option>
                          <option value="percentage">Percentage</option>
                          <option value="score">Score</option>
                          <option value="name">Name</option>
                        </select>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Direction:
                        <select value={resultsSortDir} onChange={e => setResultsSortDir(e.target.value)}>
                          <option value="asc">Asc</option>
                          <option value="desc">Desc</option>
                        </select>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Min %:
                        <input type="number" min={0} max={100} value={resultsFilterMin} onChange={e => setResultsFilterMin(e.target.value)} style={{ width: 80 }} />
                      </label>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button className="btn-outline" onClick={() => setResultsFilterMin(0)}>Clear Filter</button>
                        <button className="btn-primary" onClick={() => exportResultsCSV(sortedFilteredResults())}>Export CSV</button>
                      </div>
                    </div>

                    <div className="results-list">
                      <div className="table-header">
                        <div className="th">Rank</div>
                        <div className="th">Student</div>
                        <div className="th">Email</div>
                        <div className="th">Score</div>
                        <div className="th">%</div>
                        <div className="th">Status</div>
                        <div className="th">Completed</div>
                      </div>
                      {sortedFilteredResults().map(r => (
                        <React.Fragment key={r._id}>
                          <div className="table-row result-row" onClick={() => toggleResultExpand(r._id)} style={{ cursor: 'pointer' }}>
                            <div className="td">{r.rank}</div>
                            <div className="td student-cell">
                              <img src={r.user?.avatar || `https://ui-avatars.com/api/?name=${r.user?.name}&background=667eea&color=fff`} alt={r.user?.name} className="student-avatar" />
                              <span>{r.user?.name}</span>
                            </div>
                            <div className="td">{r.user?.email || '-'}</div>
                            <div className="td">{r.score} / {r.total}</div>
                            <div className="td">{r.percentage}%</div>
                            <div className="td">{(typeof r.percentage !== 'undefined' && typeof r.passingScore !== 'undefined') ? (r.percentage >= r.passingScore ? <span style={{color:'#10b981'}}>Pass</span> : <span style={{color:'#ef4444'}}>Fail</span>) : '-'}</div>
                            <div className="td">{new Date(r.completedAt).toLocaleString()}</div>
                          </div>

                          {expandedResults[r._id] && (
                            <div className="table-row result-detail-row">
                              <div className="td" style={{ gridColumn: '1 / -1', padding: '12px 16px' }}>
                                {detailLoading && !resultDetailsMap[r._id] ? (
                                  <div>Loading details…</div>
                                ) : resultDetailsMap[r._id] ? (
                                  <div>
                                    <div style={{ marginBottom: 8 }}><strong>Student:</strong> {resultDetailsMap[r._id].userId?.name} • {resultDetailsMap[r._id].userId?.email}</div>
                                    <div style={{ marginBottom: 8 }}><strong>Score:</strong> {resultDetailsMap[r._id].score} / {resultDetailsMap[r._id].total} • {resultDetailsMap[r._id].percentage}%</div>
                                    <div style={{ marginBottom: 12 }}><strong>Completed:</strong> {new Date(resultDetailsMap[r._id].completedAt).toLocaleString()}</div>
                                    <div>
                                      <h4>Answers</h4>
                                      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8 }} />
                                      {Array.isArray(resultDetailsMap[r._id].details) && resultDetailsMap[r._id].details.length > 0 ? (
                                        <div style={{ marginTop: 10 }}>
                                          {resultDetailsMap[r._id].details.map((d, i) => (
                                            <div key={i} style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                                              <div style={{ fontWeight: 600 }}>{i + 1}. {d.questionText}</div>
                                              <div style={{ marginTop: 6 }}><strong>Your answer:</strong> {d.userAnswer}</div>
                                              <div><strong>Correct answer:</strong> {d.correctAnswer}</div>
                                              <div style={{ marginTop: 6, color: d.correct ? '#10b981' : '#ef4444' }}>{d.correct ? 'Correct' : 'Incorrect'}</div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div>No detail available</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div>No details found.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result Details Modal */}
        {resultDetailOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 760 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Result Details</h3>
                <button className="btn-close" onClick={() => { setResultDetailOpen(false); setResultDetail(null); }}>×</button>
              </div>
              <div style={{ marginTop: 12 }}>
                {detailLoading ? (
                  <div>Loading…</div>
                ) : resultDetail ? (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Student:</strong> {resultDetail.userId?.name} • {resultDetail.userId?.email}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Score:</strong> {resultDetail.score} / {resultDetail.total} • {resultDetail.percentage}%
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Completed:</strong> {new Date(resultDetail.completedAt).toLocaleString()}
                    </div>

                    <div>
                      <h4>Answers</h4>
                      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8 }} />
                      {Array.isArray(resultDetail.details) && resultDetail.details.length > 0 ? (
                        <div style={{ marginTop: 10 }}>
                          {resultDetail.details.map((d, i) => (
                            <div key={i} style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                              <div style={{ fontWeight: 600 }}>{i + 1}. {d.questionText}</div>
                              <div style={{ marginTop: 6 }}><strong>Your answer:</strong> {d.userAnswer}</div>
                              <div><strong>Correct answer:</strong> {d.correctAnswer}</div>
                              <div style={{ marginTop: 6, color: d.correct ? '#10b981' : '#ef4444' }}>{d.correct ? 'Correct' : 'Incorrect'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>No detail available</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>No details found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
