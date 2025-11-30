import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuizResult } from '../../api/quizApi'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Results.css'

export default function Results() {
  const { resultId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getQuizResult(resultId)
        setResult(data)
      } catch (err) {
        toast.error("Error loading results")
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resultId, navigate])

  if (loading) return <Loader />
  if (!result) return <div className="container mt-4">No result found</div>

  const percentage = result.percentage || Math.round((result.score / result.total) * 100)
  const correctAnswers = result.score
  const incorrectAnswers = result.total - result.score
  const isPass = percentage >= 60

  const getGrade = (percent) => {
    if (percent >= 90) return { grade: 'A+', label: 'Outstanding', color: '#10b981' }
    if (percent >= 80) return { grade: 'A', label: 'Excellent', color: '#22c55e' }
    if (percent >= 70) return { grade: 'B', label: 'Very Good', color: '#84cc16' }
    if (percent >= 60) return { grade: 'C', label: 'Good', color: '#eab308' }
    if (percent >= 50) return { grade: 'D', label: 'Fair', color: '#f97316' }
    return { grade: 'F', label: 'Need Improvement', color: '#ef4444' }
  }

  const gradeInfo = getGrade(percentage)

  // Calculate circle animation
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Header with Score Circle */}
        <div className="results-header app-card">
          <div className="score-section">
            <div className="score-circle-wrapper">
              <svg className="score-circle" viewBox="0 0 160 160">
                <circle className="score-circle-bg" cx="80" cy="80" r="70" />
                <circle 
                  className="score-circle-progress" 
                  cx="80" 
                  cy="80" 
                  r="70"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    stroke: gradeInfo.color
                  }}
                />
              </svg>
              <div className="score-content">
                <div className="score-percentage">{percentage}%</div>
                <div className="score-grade" style={{ color: gradeInfo.color }}>
                  {gradeInfo.grade}
                </div>
              </div>
            </div>
            <div className="status-badge" style={{ 
              background: isPass ? '#d1fae5' : '#fee2e2',
              color: isPass ? '#065f46' : '#991b1b'
            }}>
              {isPass ? '✓ Passed' : '✗ Failed'}
            </div>
          </div>

          <div className="results-info">
            <h2 className="results-title">{result.quizId?.title || 'Quiz Results'}</h2>
            <p className="results-subtitle">{gradeInfo.label} Performance</p>
            
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon correct">✓</div>
                <div className="stat-details">
                  <div className="stat-value">{correctAnswers}</div>
                  <div className="stat-label">Correct</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon incorrect">✗</div>
                <div className="stat-details">
                  <div className="stat-value">{incorrectAnswers}</div>
                  <div className="stat-label">Incorrect</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon total">#</div>
                <div className="stat-details">
                  <div className="stat-value">{result.total}</div>
                  <div className="stat-label">Total</div>
                </div>
              </div>
            </div>

            <div className="completion-time">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Completed on {new Date(result.completedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="analysis-section app-card">
          <h3 className="section-title">Performance Analysis</h3>
          
          <div className="analysis-bars">
            <div className="analysis-bar">
              <div className="bar-header">
                <span className="bar-label">Accuracy Rate</span>
                <span className="bar-value">{percentage}%</span>
              </div>
              <div className="bar-track">
                <div 
                  className="bar-fill accuracy" 
                  style={{ 
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}dd)`
                  }}
                ></div>
              </div>
            </div>

            <div className="analysis-bar">
              <div className="bar-header">
                <span className="bar-label">Completion Rate</span>
                <span className="bar-value">100%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill completion" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="insights">
            <div className="insight-card">
              <span className="insight-icon">🎯</span>
              <div>
                <div className="insight-title">Success Rate</div>
                <div className="insight-text">
                  You answered {correctAnswers} out of {result.total} questions correctly
                </div>
              </div>
            </div>

            {percentage >= 80 && (
              <div className="insight-card highlight">
                <span className="insight-icon">🌟</span>
                <div>
                  <div className="insight-title">Great Job!</div>
                  <div className="insight-text">
                    You've demonstrated excellent understanding of this topic
                  </div>
                </div>
              </div>
            )}

            {percentage < 60 && (
              <div className="insight-card warning">
                <span className="insight-icon">📚</span>
                <div>
                  <div className="insight-title">Keep Learning</div>
                  <div className="insight-text">
                    Review the material and try again to improve your score
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Details */}
        <div className="details-section app-card">
          <div className="details-header">
            <h3 className="section-title">Question Breakdown</h3>
            <button 
              className="toggle-details-btn"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showDetails && (
            <div className="questions-list">
              {result.details.map((detail, index) => (
                <div 
                  key={detail.questionId} 
                  className={`question-item ${detail.correct ? 'correct' : 'incorrect'}`}
                >
                  <div className="question-item-header">
                    <span className="question-number">Question {index + 1}</span>
                    <span className={`question-result ${detail.correct ? 'correct' : 'incorrect'}`}>
                      {detail.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  
                  <p className="question-text">{detail.questionText}</p>
                  
                  {!detail.correct && detail.userAnswer && detail.correctAnswer && (
                    <div className="answer-comparison">
                      <div className="answer-box your-answer">
                        <span className="answer-label">Your Answer:</span>
                        <span className="answer-value">{detail.userAnswer}</span>
                      </div>
                      <div className="answer-box correct-answer">
                        <span className="answer-label">Correct Answer:</span>
                        <span className="answer-value">{detail.correctAnswer}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          <button 
            className="action-btn secondary"
            onClick={() => navigate('/courses')}
          >
            Browse Courses
          </button>
          <button 
            className="action-btn primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
