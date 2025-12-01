import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuizById, submitQuiz } from '../../api/quizApi'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Quiz.css'

export default function Quiz() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await getQuizById(quizId)
        setQuiz(data)
        // Set timer if duration is specified (convert minutes to seconds)
        if (data.duration) {
          setTimeLeft(data.duration * 60)
        }
      } catch (error) {
        toast.error("Failed to load quiz")
        navigate('/courses')
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [quizId, navigate])

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const changeAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmitQuiz = async () => {
    setSubmitting(true)
    try {
      const result = await submitQuiz(quizId, answers)
      toast.success(`Quiz submitted! Score: ${result.percentage}%`)
      navigate(`/results/${result.resultId}`)
    } catch (err) {
      toast.error("Error submitting quiz")
      setSubmitting(false)
    }
  }

  const goToQuestion = (index) => {
    setCurrentQuestion(index)
  }

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (questionId) => {
    if (answers[questionId]) return 'answered'
    return 'unanswered'
  }

  const answeredCount = Object.keys(answers).length

  if (loading) return <Loader />
  if (!quiz) return <div className="container mt-4">Quiz not found</div>

  const currentQ = quiz.questions[currentQuestion]

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        {/* Quiz Header */}
        <div className="quiz-header app-card">
          <div className="quiz-info">
            <h2 className="quiz-title">{quiz.title}</h2>
            {quiz.description && <p className="quiz-description">{quiz.description}</p>}
            <div className="quiz-meta">
              <span className="difficulty-badge difficulty-{quiz.difficulty?.toLowerCase()}">{quiz.difficulty}</span>
              <span className="question-count">{quiz.questions.length} Questions</span>
            </div>
          </div>
          
          {timeLeft !== null && (
            <div className={`timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
              <svg className="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="timer-text">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress app-card">
          <div className="progress-info">
            <span>Progress: {answeredCount} / {quiz.questions.length}</span>
            <span>{Math.round((answeredCount / quiz.questions.length) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Quiz Content */}
        <div className="quiz-content">
          {/* Question Display */}
          <div className="question-panel app-card">
            <div className="question-header">
              <span className="question-number">Question {currentQuestion + 1}</span>
              <span className={`status-badge ${getQuestionStatus(currentQ._id)}`}>
                {getQuestionStatus(currentQ._id) === 'answered' ? '✓ Answered' : '○ Unanswered'}
              </span>
            </div>
            
            <h3 className="question-text">{currentQ.text}</h3>

            <div className="options-list">
              {currentQ.options.map((option, idx) => (
                <label 
                  key={idx} 
                  className={`option-item ${answers[currentQ._id] === option ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    checked={answers[currentQ._id] === option}
                    onChange={() => changeAnswer(currentQ._id, option)}
                  />
                  <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{option}</span>
                  <span className="checkmark">✓</span>
                </label>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="question-navigation">
              <button 
                className="nav-btn prev-btn"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </button>
              
              {currentQuestion === quiz.questions.length - 1 ? (
                <button 
                  className="nav-btn submit-btn"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button 
                  className="nav-btn next-btn"
                  onClick={nextQuestion}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="navigator-panel app-card">
            <h4 className="navigator-title">Questions</h4>
            <div className="question-grid">
              {quiz.questions.map((q, idx) => (
                <button
                  key={q._id}
                  className={`question-nav-btn ${currentQuestion === idx ? 'active' : ''} ${getQuestionStatus(q._id)}`}
                  onClick={() => goToQuestion(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="legend">
              <div className="legend-item">
                <span className="legend-badge answered"></span>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge unanswered"></span>
                <span>Not Answered</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge active"></span>
                <span>Current</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Quiz?</h3>
            <p>You have answered {answeredCount} out of {quiz.questions.length} questions.</p>
            {answeredCount < quiz.questions.length && (
              <p className="warning-text">⚠️ Some questions are unanswered.</p>
            )}
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Review Answers
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitQuiz}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
