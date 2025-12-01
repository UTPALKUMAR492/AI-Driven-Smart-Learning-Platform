import React from 'react'
import { useNavigate } from 'react-router-dom'
import './QuizCard.css'

export default function QuizCard({ quiz }) {
  const navigate = useNavigate()

  const handleStartQuiz = () => {
    navigate(`/quiz/${quiz._id}`)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
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

  return (
    <div className="quiz-card">
      <div className="quiz-card-header">
        <div className="quiz-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <div 
          className="difficulty-tag" 
          style={{ 
            background: `${getDifficultyColor(quiz.difficulty)}20`,
            color: getDifficultyColor(quiz.difficulty)
          }}
        >
          {quiz.difficulty || 'Beginner'}
        </div>
      </div>

      <div className="quiz-card-body">
        <h3 className="quiz-card-title">{quiz.title}</h3>
        {quiz.description && (
          <p className="quiz-card-description">
            {quiz.description.length > 100 
              ? `${quiz.description.substring(0, 100)}...` 
              : quiz.description
            }
          </p>
        )}
        
        {quiz.courseId && (
          <div className="quiz-course">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z"/>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
            <span>{quiz.courseId.title}</span>
          </div>
        )}
      </div>

      <div className="quiz-card-footer">
        <div className="quiz-meta">
          <div className="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{quiz.duration || 30} min</span>
          </div>
          <div className="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span>{quiz.questions?.length || 0} questions</span>
          </div>
        </div>
        
        <button className="start-quiz-btn" onClick={handleStartQuiz}>
          Start Quiz
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
