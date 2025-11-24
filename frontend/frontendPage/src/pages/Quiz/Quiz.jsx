import React, { useEffect, useState } from 'react'
import api from '../../api/axiosConfig'
import { useParams, useNavigate } from 'react-router-dom'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Quiz.css'

export default function Quiz(){
  const { quizId } = useParams()
  const [quiz,setQuiz] = useState(null)
  const [answers,setAnswers] = useState({})
  const [loading,setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(()=>{
    api.get(`/quiz/${quizId}`)
      .then(res => setQuiz(res.data))
      .catch(()=> toast.error("Failed to load quiz"))
      .finally(()=> setLoading(false))
  },[quizId])

  const changeAnswer = (id, option) => setAnswers(prev => ({...prev, [id]:option}))

  const submitQuiz = async () => {
    try {
      const res = await api.post(`/quiz/${quizId}/submit`, { responses: answers })
      toast.success("Quiz submitted! 📝")
      navigate(`/results/${res.data.resultId}`)
    } catch (err) {
      toast.error("Error submitting quiz ❌")
    }
  }

  if(loading) return <Loader/>
  if(!quiz) return <div className="container mt-4">Quiz not found</div>

  return (
    <div className="container mt-4">
      <h3 className="page-title">{quiz.title}</h3>

      {quiz.questions.map(q => (
        <div key={q._id} className="app-card mb-3">
          <p style={{marginBottom:8}}>{q.text}</p>
          {q.options.map((op, idx) => (
            <div key={idx} className="form-check">
              <input className="form-check-input" type="radio" name={q._id} id={`${q._id}-${idx}`}
                onChange={()=> changeAnswer(q._id, op)} />
              <label className="form-check-label" htmlFor={`${q._1}-${idx}`}>{op}</label>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-2">
        <button className="btn btn-primary" onClick={submitQuiz}>Submit Quiz</button>
      </div>
    </div>
  )
}
