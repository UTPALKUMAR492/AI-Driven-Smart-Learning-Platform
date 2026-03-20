import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axiosConfig'
import { getQuizResultsAdmin, deleteQuiz as adminDeleteQuiz } from '../../api/adminApi'
import { toast } from 'react-toastify'
import './AdminQuiz.css'

export default function AdminQuiz(){
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [resultsOpen, setResultsOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // fetch quiz using public quiz route (exists at /api/quiz/:id)
        const res = await api.get(`/quiz/${quizId}`)
        setQuiz(res.data?.quiz || res.data || null)
      } catch (err) {
        console.error('Failed to load quiz', err)
        toast.error('Could not load quiz')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  const openResults = async () => {
    try {
      const res = await getQuizResultsAdmin(quizId)
      setResults(res || [])
      setResultsOpen(true)
    } catch (err) {
      console.error(err)
      toast.error('Could not load results')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this quiz?')) return
    try {
      await adminDeleteQuiz(quizId)
      toast.success('Quiz deleted')
      navigate('/admin-dashboard')
    } catch (err) {
      console.error(err)
      toast.error('Could not delete quiz')
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!quiz) return <div style={{ padding: 24 }}>Quiz not found.</div>

  return (
    <div style={{ padding: 24 }} className="admin-quiz-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>{quiz.title}</h2>
          <div style={{ color: '#6b7280' }}>{quiz.courseId?.title || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin-dashboard')} className="btn-primary">Back</button>
          <button onClick={openResults} className="btn-primary">Results</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </div>

      <div style={{ background: 'white', padding: 16, borderRadius: 12 }}>
        <h3>Questions ({quiz.questions?.length || 0})</h3>
        {(!quiz.questions || quiz.questions.length === 0) ? (
          <div className="empty">No questions</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quiz.questions.map((q, idx) => (
              <div key={idx} style={{ padding: 12, borderRadius: 8, background: '#f8fafc' }}>
                <div style={{ fontWeight: 600 }}>{idx + 1}. {q.text}</div>
                <ul style={{ marginTop: 6 }}>
                  {(q.options || []).map((opt, i) => (
                    <li key={i} style={{ color: q.correctAnswer === opt ? '#0b7' : '#333', fontWeight: q.correctAnswer === opt ? 700 : 400 }}>{String.fromCharCode(65 + i)}. {opt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {resultsOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Results</h3>
              <button className="btn-close" onClick={() => setResultsOpen(false)}>×</button>
            </div>
            <div style={{ marginTop: 12 }}>
              {results.length === 0 ? (
                <div>No results yet.</div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 8, fontWeight: 600, color: '#6b7280' }}>
                    <div>Rank</div>
                    <div>Student</div>
                    <div>Score</div>
                    <div>Completed</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {results.map(r => (
                      <div key={r._id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: 8, padding: 8, alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <div>{r.rank}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <img src={r.user?.avatar || `https://ui-avatars.com/api/?name=${r.user?.name}&background=667eea&color=fff`} alt={r.user?.name} style={{ width: 32, height: 32, borderRadius: 20 }} />
                          <div>{r.user?.name}</div>
                        </div>
                        <div>{r.score} / {r.total}</div>
                        <div>{new Date(r.completedAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
