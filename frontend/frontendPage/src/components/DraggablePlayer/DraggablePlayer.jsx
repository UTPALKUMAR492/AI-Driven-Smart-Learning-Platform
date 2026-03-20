import React, { useEffect, useRef, useState } from 'react'
import './DraggablePlayer.css'

export default function DraggablePlayer({ open, onClose, src, poster, title }){
  const ref = useRef(null)
  const pos = useRef({ x: window.innerWidth - 360, y: 120 })
  const dragging = useRef(false)
  const start = useRef({ x:0, y:0 })
  const [position, setPosition] = useState({ x: pos.current.x, y: pos.current.y })
  const [large, setLarge] = useState(false)

  useEffect(()=>{ if (open) { setPosition({ x: pos.current.x, y: pos.current.y }) } }, [open])

  useEffect(()=>{
    const onMove = (e) => {
      if (!dragging.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const dx = clientX - start.current.x
      const dy = clientY - start.current.y
      const nx = Math.max(8, Math.min(window.innerWidth - (large ? 560 : 340), pos.current.x + dx))
      const ny = Math.max(8, Math.min(window.innerHeight - (large ? 420 : 240), pos.current.y + dy))
      setPosition({ x: nx, y: ny })
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      pos.current = { x: position.x, y: position.y }
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return ()=>{
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [position, large])

  const onDown = (e) => {
    dragging.current = true
    start.current.x = e.touches ? e.touches[0].clientX : e.clientX
    start.current.y = e.touches ? e.touches[0].clientY : e.clientY
    document.body.style.userSelect = 'none'
  }

  if (!open) return null

  return (
    <div ref={ref} className={`dp-container ${large ? 'large' : ''}`} style={{ left: position.x, top: position.y }}>
      <div className="dp-header" onMouseDown={onDown} onTouchStart={onDown}>
        <div className="dp-title">{title || 'Player'}</div>
        <div className="dp-actions">
          <button className="dp-btn" onClick={() => setLarge(!large)}>{large ? '↘' : '⬜'}</button>
          <button className="dp-btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="dp-body">
        <video controls src={src} poster={poster} className="dp-video" />
      </div>
    </div>
  )
}
