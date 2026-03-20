import React, { useEffect, useState, useContext } from 'react'
import { getUserPayments } from '../../api/paymentApi'
import { AuthContext } from '../../context/AuthContext'
import { toast } from 'react-toastify'

export default function MyPayments(){
  const { user } = useContext(AuthContext)
  const [payments, setPayments] = useState([])

  useEffect(()=>{
    if (!user) return
    getUserPayments().then(p => setPayments(p)).catch(e => { console.error(e); toast.error('Could not load payments') })
  },[user])

  if (!user) return <div>Please login to view payments</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>My Payments</h2>
      {payments.length === 0 ? <div>No payments yet</div> : (
        <ul>
          {payments.map(p => (
            <li key={p._id}>{p.course?.title || 'Course'} — {p.amount} — {p.status} — {new Date(p.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
