import React, { useEffect, useState, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import { getCourseById, enrollInCourse, getEnrolledCourses, addReview, updateProgress } from '../../api/courseApi'
import { createDummyPayment } from '../../api/paymentApi'
import { AuthContext } from '../../context/AuthContext'
import PaymentModal from '../../components/PaymentModal/PaymentModal'
import ShareModal from '../../components/ShareModal/ShareModal'
import DraggablePlayer from '../../components/DraggablePlayer/DraggablePlayer'
import StudentToolbar from '../../components/StudentToolbar/StudentToolbar'
import ReportModal from '../../components/ReportModal/ReportModal'
import './CourseDetails.css'

export default function CourseDetailsSimple(){
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false)
  const [floatingSrc, setFloatingSrc] = useState(null)
  const [floatingTitle, setFloatingTitle] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [modalBusy, setModalBusy] = useState(false)
  const playerRef = useRef(null)
  const videoElRef = useRef(null)
  const [activeTab, setActiveTab] = useState('content')
  const [courseProgress, setCourseProgress] = useState(0)

  // Reviews state (moved here to keep hook order stable)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)

  useEffect(() => { load() }, [id, user])

  // Make any element with class 'embedded-panel' draggable (mouse + touch)
  useEffect(() => {
    const panels = () => Array.from(document.querySelectorAll('.embedded-panel'))
    let cleanupFns = []
    const make = (el) => {
      if (!el) return
      el.style.position = 'fixed'
      el.style.cursor = 'default'
      let dragging = false
      let startX = 0
      let startY = 0
      let origX = el.getBoundingClientRect().left
      let origY = el.getBoundingClientRect().top

      const onDown = (e) => {
        e.preventDefault()
        dragging = true
        startX = e.touches ? e.touches[0].clientX : e.clientX
        startY = e.touches ? e.touches[0].clientY : e.clientY
        const rect = el.getBoundingClientRect()
        origX = rect.left
        origY = rect.top
        document.body.style.userSelect = 'none'
      }

      const onMove = (e) => {
        if (!dragging) return
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        const dx = clientX - startX
        const dy = clientY - startY
        const nx = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, origX + dx))
        const ny = Math.max(8, Math.min(window.innerHeight - el.offsetHeight - 8, origY + dy))
        el.style.left = nx + 'px'
        el.style.top = ny + 'px'
      }

      const onUp = () => {
        if (!dragging) return
        dragging = false
        document.body.style.userSelect = ''
      }

      // Try to use a header inside the panel as drag handle if present
      const handle = el.querySelector('.embedded-panel-handle') || el
      handle.style.touchAction = 'none'
      handle.addEventListener('mousedown', onDown)
      handle.addEventListener('touchstart', onDown, { passive: false })
      window.addEventListener('mousemove', onMove)
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchend', onUp)

      // cleanup
      return () => {
        handle.removeEventListener('mousedown', onDown)
        handle.removeEventListener('touchstart', onDown)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('touchend', onUp)
      }
    }

    const init = () => {
      cleanupFns.forEach(fn => fn())
      cleanupFns = panels().map(make)
    }

    // run now and when DOM changes (mutation observer)
    init()
    const mo = new MutationObserver(() => init())
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { mo.disconnect(); cleanupFns.forEach(fn => fn()) }
  }, [])

  const load = async () => {
    try{
      const data = await getCourseById(id)
      setCourse(data)
      // Honor server-side enrolled flag if present (avoids extra request and fixes refresh cases)
      if (typeof data?.isEnrolled !== 'undefined') setIsEnrolled(Boolean(data.isEnrolled))
      if (data?.lessons?.length) setActiveLesson(data.lessons[0])
      // initialize course progress if server provided it
      if (typeof data?.userProgress?.percentComplete !== 'undefined') setCourseProgress(Number(data.userProgress.percentComplete) || 0)
      // load cart/wishlist state from localStorage
      try{
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const wish = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setIsInCart(Boolean(cart.find(i => i.id === (data._id || id))))
        setIsInWishlist(Boolean(wish.find(i => i.id === (data._id || id))))
      }catch(e){/* ignore */}
      // check enrollment for logged in user (fallback when server didn't provide flag)
      if (user && typeof data?.isEnrolled === 'undefined') {
        try {
          const enrolled = await getEnrolledCourses()
          const courseId = String(data._id || id)
          const has = (enrolled || []).some((c) => {
            if (!c) return false
            // enrolled entry may be an Object with a `course` field (populated) or a plain id
            if (typeof c === 'string' || typeof c === 'number') return String(c) === courseId
            if (c._id) return String(c._id) === courseId
            if (c.course) return String(c.course._id || c.course) === courseId
            return false
          })
          setIsEnrolled(Boolean(has))
        } catch (e) {
          console.debug('Could not verify enrollment', e)
        }
      }
    }catch(err){
      toast.error('Failed to load course')
    }finally{ setLoading(false) }
  }

  const resolveMediaUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const host = apiBase.replace(/\/api\/?$/, '')
    if (url.startsWith('/')) return host + url
    return host + '/' + url
  }

  if (loading) return <Loader />
  if (!course) return <div className="course-not-found">Course not found</div>

  const price = course?.price || 0

  const handleBuy = () => {
    if (!user) { toast.info('Please log in to purchase'); return }
    if (isEnrolled) { toast.info('Already enrolled — click Continue learning') ; return }
    setShowPaymentModal(true)
  }

  const addToCart = () => {
    // toggle add/remove in localStorage (demo)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const found = cart.find(i => i.id === (course._id || id))
    if (!found) {
      cart.push({ id: course._id || id, title: course.title, price: price })
      localStorage.setItem('cart', JSON.stringify(cart))
      setIsInCart(true)
      toast.success('Added to cart')
    } else {
      const updated = cart.filter(i => i.id !== (course._id || id))
      localStorage.setItem('cart', JSON.stringify(updated))
      setIsInCart(false)
      toast.success('Removed from cart')
    }
  }

  const addToWishlist = () => {
    const wish = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const found = wish.find(i => i.id === (course._id || id))
    if (!found) {
      wish.push({ id: course._id || id, title: course.title })
      localStorage.setItem('wishlist', JSON.stringify(wish))
      setIsInWishlist(true)
      toast.success('Added to wishlist')
    } else {
      const updated = wish.filter(i => i.id !== (course._id || id))
      localStorage.setItem('wishlist', JSON.stringify(updated))
      setIsInWishlist(false)
      toast.success('Removed from wishlist')
    }
  }

  const handleReportSend = (text) => {
    // placeholder: send to server or save locally
    console.debug('Report submitted', text)
    toast.success('Report submitted — thank you')
    setShowReportModal(false)
  }

  const handleContinue = () => {
    if (!activeLesson && course.lessons?.length) setActiveLesson(course.lessons[0])
    // scroll to video
    setTimeout(() => {
      if (playerRef.current) playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else window.scrollTo({ top: 300, behavior: 'smooth' })
    }, 80)
  }

  const handleToggleComplete = async (lesson) => {
    if (!user) { toast.info('Please login to track progress'); return }
    // need lesson id to update progress
    const lessonId = lesson?._id
    if (!lessonId) { toast.error('Cannot mark this lesson complete (missing ID)'); return }
    try {
      const res = await updateProgress(id, lessonId, { completed: true, watchedDuration: lesson.duration || 0 })
      if (res && typeof res.progress !== 'undefined') {
        setCourseProgress(Number(res.progress) || 0)
        // mark lesson locally as completed
        setCourse(prev => ({ ...prev, lessons: (prev.lessons || []).map(l => l._id === lessonId ? { ...l, completed: true } : l) }))
        toast.success('Marked lesson complete')
      } else {
        toast.success('Progress updated')
      }
    } catch (e) {
      console.error('Progress update failed', e)
      toast.error(e?.message || 'Could not update progress')
    }
  }

  const handleVideoEnded = async () => {
    // auto mark activeLesson complete when video ends
    if (!user || !isEnrolled || !activeLesson) return
    const lessonId = activeLesson._id
    if (!lessonId) return
    // if already completed skip
    if (activeLesson.completed) return
    try {
      const res = await updateProgress(id, lessonId, { completed: true, watchedDuration: activeLesson.duration || 0 })
      if (res && typeof res.progress !== 'undefined') {
        setCourseProgress(Number(res.progress) || 0)
      }
      // update local lesson state
      setCourse(prev => ({ ...prev, lessons: (prev.lessons || []).map(l => l._id === lessonId ? { ...l, completed: true } : l) }))
      toast.success('Lesson marked complete')
    } catch (e) {
      console.error('Auto-complete failed', e)
    }
  }

  const openFloatingPlayer = (videoUrl, lessonTitle) => {
    if (!videoUrl) return
    setFloatingSrc(resolveMediaUrl(videoUrl))
    setFloatingTitle(lessonTitle || course.title)
    setShowFloatingPlayer(true)
  }

  const onPay = async (payload, forcedStatus) => {
    // payload from PaymentModal
    try {
      setModalBusy(true)
      const body = { courseId: id, amount: price, status: forcedStatus === 'rejected' ? 'rejected' : 'success', metadata: payload || {} }
      const res = await createDummyPayment(body)
      // Do not toast payment message here to avoid duplicate toasts.
      // Modal UI will show payment result; enrollment toast will indicate access.

      // auto-enroll after a successful payment
      if (res && body.status === 'success') {
        try {
          await enrollInCourse(id)
          setIsEnrolled(true)
          toast.success('Enrolled — enjoy the course')
          // close payment modal after successful enrollment
          setShowPaymentModal(false)
          // open/continue learning
          handleContinue()
        } catch (e) {
          // if enrollment returns 400 and indicates already enrolled, don't show duplicate toast
          const emsg = e?.info?.message || e?.response?.data?.message || e?.message || ''
          const status = e?.status || e?.info?.status || e?.response?.status
          if (status === 400 && String(emsg).toLowerCase().includes('already')) {
            setIsEnrolled(true)
            handleContinue()
          } else {
            console.warn('Enroll after payment failed', e)
          }
        }
      }
      return res
    } finally { setModalBusy(false) }
  }
  
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.info('Please log in to review'); return }
    try {
      await addReview(id, { rating: reviewRating, comment: reviewText })
      toast.success('Review submitted')
      setReviewText('')
      setReviewRating(5)
      await load()
    } catch (err) {
      console.error('Review error', err)
      toast.error(err?.response?.data?.message || 'Could not submit review')
    }
  }

  return (
    <div className="course-details-page simple">
      <div className="course-header-section">
        <div className="course-header-content">
          <h1 className="course-title">{course.title}</h1>
          
          {/* subtitle intentionally omitted */}
          <StudentToolbar
            onShare={() => setShowShareModal(true)}
            onEnroll={() => { if (!isEnrolled) handleBuy(); else handleContinue() }}
            onWishlist={addToWishlist}
            onReport={() => setShowReportModal(true)}
            isEnrolled={isEnrolled}
            isInWishlist={isInWishlist}
          />

          {user && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, maxWidth: 520 }}>
                <div className="progress-bar-lg">
                  <div className="fill" style={{ width: `${courseProgress}%` }} />
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{courseProgress}% complete</div>
              </div>
            </div>
          )}

          <div className="course-tabs" style={{ marginTop: 18 }}>
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>Course Content</button>
            <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
            <button className={`tab ${activeTab === 'instructor' ? 'active' : ''}`} onClick={() => setActiveTab('instructor')}>Instructor</button>
          </div>
        </div>
      </div>

      <div className="course-main-layout" style={{ display: 'flex', gap: 24, padding: '2rem' }}>
        <main style={{ flex: 1, maxWidth: 920 }}>
          {activeTab === 'content' && (
            <div ref={playerRef} className="video-player-section">
              {activeLesson && activeLesson.videoUrl ? (
                <div style={{ position: 'relative' }}>
                  <video ref={videoElRef} onEnded={handleVideoEnded} controls className="video-player" src={resolveMediaUrl(activeLesson.videoUrl)} poster={course.thumbnail} />
                  <button className="btn-open-player" onClick={() => openFloatingPlayer(activeLesson.videoUrl, activeLesson.title)} title="Open movable player">Open player</button>
                </div>
              ) : (
                <div className="no-video">No video available</div>
              )}
              <div className="current-lesson-info">
                <h3>{activeLesson?.title}</h3>
                <p>{activeLesson?.description || ''}</p>
              </div>

              <div style={{ marginTop: 16 }} className="notes-panel">
                <h4>Notes</h4>
                {activeLesson?.notes ? (
                  (activeLesson.notes.startsWith('http') || activeLesson.notes.startsWith('/')) ? (
                    <a href={resolveMediaUrl(activeLesson.notes)} target="_blank" rel="noreferrer">Download Notes</a>
                  ) : (
                    <div>{activeLesson.notes}</div>
                  )
                ) : (
                  <div>No notes for this lesson</div>
                )}
              </div>
              {/* share panel removed from main content - moved to sidebar for better visibility */}
              <div style={{ marginTop: 18 }} className="lessons-list">
                {(course.lessons || []).map((l, idx) => (
                  <div
                    key={l._id || idx}
                    className={`lesson-card ${l === activeLesson ? 'active' : ''}`}
                    onClick={() => {
                      setActiveLesson(l)
                      setTimeout(() => {
                        if (playerRef.current) playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 80)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setActiveLesson(l); if (playerRef.current) playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>{idx + 1}. {l.title}</div>
                      <div style={{ color: '#6b7280' }}>{l.duration || 0} min</div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      {user && isEnrolled && (
                        // show status driven by completion (auto via video end)
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {l.completed ? (
                            <span className="lesson-completed-badge">Completed</span>
                          ) : (
                            <span className="lesson-pending-badge">In progress</span>
                          )}
                        </div>
                      )}
                      {l.notes && (
                        <a onClick={(e) => { e.stopPropagation(); setActiveLesson(l) }} style={{ marginLeft: 8, color: '#2563eb', cursor: 'pointer' }}>Open notes</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="lesson-notes" style={{ marginTop: 16 }}>
              <h4>Description</h4>
              <div style={{ marginBottom: 12 }}>{course.description || 'No description available.'}</div>
              {Array.isArray(course.notes) && course.notes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4>Course Notes</h4>
                  <ul>
                    {course.notes.map((n, i) => (
                      <li key={i}>
                        {(n && (n.startsWith('http') || n.startsWith('/')))
                          ? <a href={resolveMediaUrl(n)} target="_blank" rel="noreferrer">Download note {i+1}</a>
                          : <span>{n}</span>
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <h4>What you'll learn</h4>
              <ul>
                {(course.topics || ['No topics provided']).map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="course-reviews" style={{ marginTop: 18 }}>
              <h3>Reviews</h3>
              {Array.isArray(course.reviews) && course.reviews.length > 0 ? (
                <ul>
                  {course.reviews.map(r => (
                    <li key={r._id} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>{r.user?.name || 'User'}</strong>
                        <div className="review-stars" aria-hidden style={{ display: 'flex', gap: 4 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`star ${i < (r.rating || 0) ? 'filled' : ''}`} style={{ fontSize: 16 }}>{i < (r.rating || 0) ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 13 }}>{r.comment}</div>
                    </li>
                  ))}
                </ul>
              ) : <div>No reviews yet</div>}

                      {/* Review submission form for logged in users */}
                      {user ? (
                        <div style={{ marginTop: 18, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                          <h4>Write a review</h4>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button key={i} type="button" onClick={() => setReviewRating(i+1)} className={`star interactive ${i < reviewRating ? 'filled' : ''}`} style={{ fontSize: 20, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                ★
                              </button>
                            ))}
                            <div style={{ color: '#6b7280' }}>{reviewRating} / 5</div>
                          </div>

                          <form onSubmit={handleSubmitReview}>
                            <textarea placeholder="Share your experience" value={reviewText} onChange={e => setReviewText(e.target.value)} style={{ width: '100%', minHeight: 90, padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button type="submit" className="btn-submit">Submit review</button>
                              <button type="button" className="btn-cancel" onClick={() => { setReviewText(''); setReviewRating(5); }}>Cancel</button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div style={{ marginTop: 12 }}>Please log in to submit a review.</div>
                      )}
            </div>
          )}

          {activeTab === 'instructor' && (
            <div style={{ marginTop: 18 }}>
              <h3>Instructor</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {course.instructor?.avatar ? <img src={resolveMediaUrl(course.instructor.avatar)} alt="avatar" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} /> : null}
                <div>
                  <div style={{ fontWeight: 700 }}>{course.instructor?.name || course.instructorName}</div>
                  <div style={{ color: '#6b7280' }}>{course.instructor?.headline || course.instructorBio || ''}</div>
                  {course.instructor?.bio && (
                    <div style={{ marginTop: 8, color: '#374151', maxWidth: 640 }}>{course.instructor.bio}</div>
                  )}
                  <div style={{ marginTop: 10, display: 'flex', gap: 12, color: '#6b7280', fontSize: 13 }}>
                    <div>{course.instructor?.totalCourses ? `${course.instructor.totalCourses} courses` : 'Instructor'}</div>
                    <div>{course.instructor?.studentsCount ? `${course.instructor.studentsCount} students` : ''}</div>
                    <div style={{ color: '#f59e0b' }}>{(course.instructor?.rating || course.rating || 0).toFixed(1)} ★</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="course-sidebar" style={{ width: 340 }}>
          <div className="sidebar-card sidebar-content">
            <div className="preview-video">
              {course.thumbnail ? <img src={resolveMediaUrl(course.thumbnail)} alt="preview" /> : <div className="preview-placeholder"><div className="icon">🎬</div></div>}
              <div className="play-overlay"><div className="play-icon">▶</div><div className="preview-text">Preview this course</div></div>
            </div>

            <div style={{ marginTop: 12 }}>
              {!isEnrolled ? (
                <div>
                  <div className={`current-price ${price <= 0 ? 'free' : ''}`}>{price > 0 ? `₹ ${price}` : 'Free'}</div>
                  {/* {course.originalPrice && <div className="original-price">₹ {course.originalPrice}</div>} */}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="current-price" style={{ color: '#10b981' }}>Enrolled</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              {!isEnrolled ? (
                <div className="sidebar-actions">
                  <button className="btn-enroll" onClick={handleBuy} disabled={modalBusy}>
                    {price > 0 ? `Buy course — ₹ ${price}` : 'Enroll now'}
                  </button>
                  <button className="btn-share" onClick={() => setShowShareModal(true)}>Share this course</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-cart" onClick={addToCart}>{isInCart ? 'Remove from cart' : 'Add to Cart'}</button>
                    <button className={`btn-wishlist ${isInWishlist ? 'active' : ''}`} onClick={addToWishlist}>{isInWishlist ? 'Remove' : 'Wishlist'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn-go-to-course" onClick={handleContinue}>Continue learning</button>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>You have access to this course.</div>
                </div>
              )}
            </div>

            <div className="guarantee">30-day money-back guarantee • Lifetime access</div>
            <div className="course-includes">
              <h4>Includes</h4>
              <ul>
                <li>Full lifetime access</li>
                <li>Certificate of completion</li>
                <li>Downloadable resources</li>
              </ul>
            </div>
            {/* Sidebar share card - professional placement */}
            <div className="sidebar-share-card" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>Share & Feedback</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{courseProgress}%</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button className="share-icon" title="Copy link" onClick={async () => { const url = window.location.origin + `/courses/${id}`; try { await navigator.clipboard.writeText(url); toast.success('Link copied') } catch(e){ toast.error('Copy failed') } }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 14L21 3" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 10V3H14" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21H3V3" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="share-icon mail" title="Email" onClick={() => { const url = encodeURIComponent(window.location.origin + `/courses/${id}`); window.open(`mailto:?subject=${encodeURIComponent('Check out this course')}&body=${url}`) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L12 13L21 8.5"/></svg>
                </button>
                <button className="share-icon" title="Twitter" onClick={() => { const url = encodeURIComponent(window.location.origin + `/courses/${id}`); window.open(`https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(course.title || '')}`, '_blank') }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg"><path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0016 3a4.5 4.5 0 00-4.48 4.48c0 .35.04.69.11 1.02A12.8 12.8 0 013 4s-4 9 5 13a13 13 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                </button>
                <button className="share-icon" title="Facebook" onClick={() => { const url = encodeURIComponent(window.location.origin + `/courses/${id}`); window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank') }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.1v-2.9h2.1V9.4c0-2.1 1.3-3.3 3.2-3.3.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.6-1.3 1.2v1.5h2.2l-.35 2.9h-1.85v7A10 10 0 0022 12z"/></svg>
                </button>
                <button className="share-icon" title="LinkedIn" onClick={() => { const url = encodeURIComponent(window.location.origin + `/courses/${id}`); window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent(course.title||'')}`, '_blank') }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-14h4v2"/></svg>
                </button>
                <button className="share-icon whatsapp" title="WhatsApp" onClick={() => { const url = encodeURIComponent(window.location.origin + `/courses/${id}`); window.open(`https://wa.me/?text=${encodeURIComponent(course.title + ' - ' + (window.location.origin + `/courses/${id}`))}`, '_blank') }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M20.52 3.48A11.93 11.93 0 0012 .5 11.93 11.93 0 003.48 3.48 11.91 11.91 0 00.5 12c0 2 0.5 3.9 1.48 5.6L.5 23.5l5-1.5A11.91 11.91 0 0012 23.5c5.3 0 9.7-3.48 11.52-8.02A11.93 11.93 0 0024 12a11.93 11.93 0 00-3.48-8.52zM12 20.5a8.4 8.4 0 01-4.4-1.2l-.3-.18-3.1.9.9-3.02-.2-.3A8.4 8.4 0 013.5 12a8.5 8.5 0 0114.9-5.8A8.43 8.43 0 0120.5 12 8.5 8.5 0 0112 20.5z"/></svg>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ color: '#6b7280', fontSize: 13 }}>How do you like this?</div>
                <div className="rating-inline">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} className={`star-btn ${i < (course._localRating || 0) ? 'filled' : ''}`} onClick={() => { const r = i+1; localStorage.setItem('course_feedback_' + id, r); course._localRating = r; toast.success('Thanks for your feedback'); setCourse({ ...course }) }} title={`${i+1} star`}>★</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <PaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} onPay={onPay} amount={price} />
      <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} url={location.href} title={course.title} />
      <DraggablePlayer open={showFloatingPlayer} onClose={() => setShowFloatingPlayer(false)} src={floatingSrc} poster={course.thumbnail} title={floatingTitle} />
      <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} onSend={handleReportSend} />
    </div>
  )
}
