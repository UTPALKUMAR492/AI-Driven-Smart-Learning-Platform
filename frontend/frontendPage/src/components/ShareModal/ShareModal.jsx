import React from 'react'
import { toast } from 'react-toastify'
import './ShareModal.css'

export default function ShareModal({ open, onClose, url, title }){
  if (!open) return null

  const copy = async (text) => {
    try{
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard')
    }catch(e){
      console.debug('copy failed', e)
      toast.error('Could not copy link')
    }
  }

  const mailto = `mailto:?subject=${encodeURIComponent(title || 'Course')}&body=${encodeURIComponent(url || '')}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent((title ? title + ' - ' : '') + (url || ''))}`

  return (
    <div className="sm-overlay" role="dialog" aria-modal="true">
      <div className="sm-modal">
        <div className="sm-header">
          <h3>Share this course</h3>
          <button className="sm-close" onClick={onClose}>×</button>
        </div>

        <div className="sm-body">
          <p>Share via social or copy the link below.</p>

          <div className="sm-actions">
            <a className="sm-btn" href={mailto} onClick={onClose} rel="noreferrer">Email</a>
            <a className="sm-btn" href={whatsapp} target="_blank" rel="noreferrer" onClick={onClose}>WhatsApp</a>
            <button className="sm-btn" onClick={() => { copy(url); onClose(); }}>Copy link</button>
          </div>

          <div className="sm-link">
            <input readOnly value={url || ''} />
            <button onClick={() => copy(url)}>Copy</button>
          </div>
        </div>
      </div>
    </div>
  )
}
