import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axiosConfig'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import './Results.css'

export default function Results(){
  const { resultId } = useParams()
  const [result,setResult] = useState(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    const fetchData = async () => {
      try {
        const res = await api.get(`/results/${resultId}`)
        setResult(res.data)
      } catch (err) {
        toast.error("Error loading results ❌")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  },[resultId])

  if(loading) return <Loader/>
  if(!result) return <div className="container mt-4">No result found</div>

  return (
    <div className="container mt-4">
      <div className="app-card">
        <h3>Quiz Result</h3>
        <p className="text-muted">Score: <strong>{result.score}</strong> / {result.total}</p>

        <h5 className="mt-3">Question Breakdown</h5>
        <ul>
          {result.details.map(d => (
            <li key={d.questionId} style={{marginBottom:8}}>
              <span style={{marginRight:8}}>{d.correct ? '✔' : '✖'}</span>
              {d.questionText}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
