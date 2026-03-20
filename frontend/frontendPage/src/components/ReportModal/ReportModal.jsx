import React, { useState } from 'react'
import './ReportModal.css'

export default function ReportModal({ open, onClose, onSend }){
  const [text, setText] = useState('')
  if (!open) return null
  return (
    <div className="rm-overlay">
      <div className="rm-modal">
        <div className="rm-header"><h3>Report an issue</h3><button onClick={onClose}>×</button></div>
        <div className="rm-body">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Describe the issue" />
          <div className="rm-actions">
            <button onClick={()=>{ onSend(text); setText('') }}>Send</button>
            <button className="rm-cancel" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
