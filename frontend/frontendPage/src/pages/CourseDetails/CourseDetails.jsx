import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourseById, enrollInCourse, getEnrolledCourses, addReview } from '../../api/courseApi'
import { createDummyPayment } from '../../api/paymentApi'
import PaymentModal from '../../components/PaymentModal/PaymentModal'
import Loader from '../../components/Loader/Loader'
import { toast } from 'react-toastify'
import { AuthContext } from '../../context/AuthContext'
import './CourseDetails.css'

export default function CourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useContext(AuthContext)

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [modalBusy, setModalBusy] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [isEmbeddedOpen, setIsEmbeddedOpen] = useState(false)

  // Reload course when id or auth state changes so protected calls run after login token is restored
  useEffect(() => { loadCourse() }, [id, user, authLoading])

  async function loadCourse() {
    setLoading(true)
    try {
      const data = await getCourseById(id)
      setCourse(data)
      // Use server-provided enrolled flag when available to avoid extra call and persistence issues
      if (typeof data?.isEnrolled !== 'undefined') setIsEnrolled(Boolean(data.isEnrolled))
      // check if user is enrolled and load payments only after auth has restored
      if (user && !authLoading) {
        try {
          const enrolled = await getEnrolledCourses()
          const courseId = String(data._id || id)
          const has = (enrolled || []).some((c) => {
            if (!c) return false
            if (typeof c === 'string' || typeof c === 'number') return String(c) === courseId
            if (c._id) return String(c._id) === courseId
            if (c.course) return String(c.course._id || c.course) === courseId
            return false
          })
          setIsEnrolled(Boolean(has))
        } catch (e) {
          console.warn('Could not fetch enrolled courses', e)
        }
        // payments intentionally not loaded on course page (kept on My Payments page)
      } else {
        setIsEnrolled(false)
      }
    } catch (err) {
      console.error('loadCourse', err)
      toast.error('Failed to load course')
    } finally { setLoading(false) }
  }

  const handleEnroll = async () => {
    if (!user) { toast.info('Please login'); navigate('/login'); return }
    if (isEnrolled) {
      setIsEmbeddedOpen(true)
      return
    }
    // If free course, enroll directly
    const price = course?.price || 0
    if (!price || course?.isFree) {
      try {
        await enrollInCourse(id)
        toast.success('Enrolled successfully')
          setIsEnrolled(true)
          await loadCourse()
        setIsEmbeddedOpen(true)
      } catch (err) {
        const serverMsg = err?.response?.data?.message || err?.info?.message || err?.message
        toast.error(serverMsg || 'Failed to enroll')
      }
      return
    }
    // Paid course -> open payment modal
    setShowPaymentModal(true)
  }

  const handleDummyPayment = async (status) => {
    // open payment modal (we don't show payments on course page)
    if (!user) { toast.info('Please login'); navigate('/login'); return }
    setShowPaymentModal(true)
  }

  const handleModalPay = async (payload, forcedStatus) => {
    const status = forcedStatus || 'success'
    try {
      setModalBusy(true)
      const amount = (payload && payload.amount) || course?.price || 0
      const body = { courseId: id, amount, status: status === 'rejected' ? 'rejected' : 'success', metadata: (payload && payload.metadata) || { method: payload?.method || 'card' } }
      const res = await createDummyPayment(body)
      // show single toast for recording
      const serverMessage = res?.message || res?.data?.message
      if (serverMessage) toast.success(serverMessage)
      setShowPaymentModal(false)
      // Auto-enroll after successful payment
      if (body.status === 'success') {
        try {
          await enrollInCourse(id)
          await loadCourse()
          setIsEmbeddedOpen(true)
        } catch (enErr) {
          // if already enrolled, treat as success and open course
          const emsg = enErr?.info?.message || enErr?.response?.data?.message || enErr?.message || ''
          const status = enErr?.status || enErr?.info?.status || enErr?.response?.status
          if (status === 400 && String(emsg).toLowerCase().includes('already')) {
            toast.info('Already enrolled — opening course')
            setIsEmbeddedOpen(true)
          } else {
            const msg = enErr?.response?.data?.message || enErr?.info?.message || enErr?.message
            toast.error(msg || 'Enrollment failed after payment')
          }
        }
      }
    } catch (err) {
      console.error('Payment error', err)
      const msg = err?.response?.data?.message || err?.message || 'Payment failed'
      toast.error(msg)
    } finally {
      setModalBusy(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.info('Please login to review'); navigate('/login'); return }
    try {
      await addReview(id, { rating: reviewRating, comment: reviewText })
      toast.success('Review submitted')
      setReviewText('')
      setReviewRating(5)
      await loadCourse()
    } catch (err) {
      console.error('Review error', err)
      toast.error(err?.response?.data?.message || 'Could not submit review')
    }
  }

  // Return normalized media info { type: 'youtube'|'video'|'none', url, externalUrl? }
  const getMediaInfo = (url) => {
    if (!url) return { type: 'none', url: '' }
    try {
      let raw = String(url).trim()
      // If relative path, prefix API url
      if (raw.startsWith('/')) raw = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + raw

      // If direct video file (mp4, webm, ogg)
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)) {
        return { type: 'video', url: raw }
      }

      const lower = raw.toLowerCase()
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        // try URL parsing first
        let vid = null
        try {
          const parsed = new URL(raw)
          vid = parsed.searchParams.get('v')
          if (!vid) {
            const parts = parsed.pathname.split('/').filter(Boolean)
            // last segment often contains the id (shorts, embed, youtu.be style)
            vid = parts.length ? parts[parts.length - 1] : null
          }
        } catch (e) {
          // fallback regex
          const m = raw.match(/(?:v=|\/|be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/) // allow 6+ chars
          vid = m ? m[1] : null
        }
        if (vid) {
          return { type: 'youtube', url: `https://www.youtube.com/embed/${vid}`, externalUrl: `https://www.youtube.com/watch?v=${vid}` }
        }
      }

      // Fallback: absolute http(s) treat as video source (some CDNs serve direct mp4 without extension)
      if (/^https?:\/\//i.test(raw)) return { type: 'video', url: raw }

      // last resort: return as video url (might work if served correctly)
      return { type: 'video', url: raw }
    } catch (e) {
      return { type: 'none', url: '' }
    }
  }

  if (loading) return <Loader />
  if (!course) return <div className="course-not-found">Course not found</div>

  const discountedPrice = course.price?.discount
    ? course.price.amount * (1 - course.price.discount / 100)
    : course.price?.amount

  return (
    <div className="course-details-page">
      <h1 className="course-title">{course.title || 'Course'}</h1>
      <p className="course-subtitle">{course.subtitle}</p>
      <div className="course-actions">
        <button className="btn-primary" onClick={handleEnroll}>{isEnrolled ? 'Continue learning' : 'Enroll / Start'}</button>
        {!isEnrolled && (
          <button className="btn-outline" style={{ marginLeft: 12 }} onClick={() => setShowPaymentModal(true)}>Buy course</button>
        )}
      </div>

      <div className="course-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginTop: 20 }}>
        <div className="course-main">
          {/* Video / Lesson player */}
          <div className="player-wrapper" style={{ background: '#000', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {course.lessons && course.lessons.length > 0 ? (
              (() => {
                const mediaInfo = getMediaInfo(course.lessons[currentLessonIndex]?.videoUrl)
                if (mediaInfo.type === 'youtube') {
                  return (
                    <div style={{ width: '100%' }}>
                      <iframe title="lesson-video" src={mediaInfo.url} style={{ width: '100%', height: 420, border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      <div style={{ marginTop: 8 }}>
                        <a href={mediaInfo.externalUrl || mediaInfo.url} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
                      </div>
                    </div>
                  )
                }
                if (mediaInfo.type === 'video') {
                  const poster = getMediaInfo(course.thumbnail).url || undefined
                  return <video controls crossOrigin="anonymous" poster={poster} style={{ width: '100%' }} src={mediaInfo.url} />
                }
                return <div style={{ color: '#fff' }}>No playable lesson available</div>
              })()
            ) : (
              <div style={{ color: '#fff' }}>No playable lesson available</div>
            )}
          </div>

          <div className="course-instructor">
            <img
              src={course.instructor?.avatar || `https://ui-avatars.com/api/?name=${course.instructor?.username || 'Instructor'}&background=667eea&color=fff`}
              alt={course.instructor?.username}
              className="instructor-avatar"
            />
            <div>
              <span className="label">Created by</span>
              <span className="name">{course.instructor?.username || 'Unknown Instructor'}</span>
            </div>
          </div>

          {/* Description & Notes */}
          <div className="lesson-notes" style={{ marginTop: 16 }}>
            <h4>Description</h4>
            <div style={{ marginBottom: 12 }}>{course.description || 'No description available.'}</div>
            <h4>Notes</h4>
                    <div>
                      {(() => {
                        const notes = course.lessons && course.lessons[currentLessonIndex]?.notes
                        if (!notes) return 'No notes for this lesson.'
                        // If it's a URL
                        try {
                          const raw = String(notes).trim()
                          if (/^https?:\/\//i.test(raw)) {
                            // PDF file
                            if (/\.pdf(\?.*)?$/i.test(raw)) {
                              return (
                                <div>
                                  <div style={{ marginBottom: 8 }}>
                                    <a href={raw} target="_blank" rel="noopener noreferrer">Open lesson notes (PDF)</a>
                                  </div>
                                  <iframe src={raw} style={{ width: '100%', height: 420, border: 0 }} title="lesson-notes-pdf" />
                                </div>
                              )
                            }
                            // other file/url -> show link
                            return <a href={raw} target="_blank" rel="noopener noreferrer">Open lesson notes</a>
                          }
                        } catch (e) {
                          // fallthrough to render as text
                        }
                        // otherwise render as plain text (allow basic newlines)
                        return <div style={{ whiteSpace: 'pre-wrap' }}>{String(notes)}</div>
                      })()}
                    </div>
          </div>

          {/* Reviews */}
          <div className="course-reviews" style={{ marginTop: 18 }}>
            <h3>Reviews</h3>
            {Array.isArray(course.reviews) && course.reviews.length > 0 ? (
              <ul>
                {course.reviews.map(r => (
                  <li key={r._id} style={{ marginBottom: 8 }}>
                    <strong>{r.user?.name || 'User'}</strong> — <em>{r.rating} / 5</em>
                    <div style={{ fontSize: 13 }}>{r.comment}</div>
                  </li>
                ))}
              </ul>
            ) : <div>No reviews yet</div>}

            <form onSubmit={handleSubmitReview} style={{ marginTop: 12 }}>
              <h4>Submit a review</h4>
              <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))}>
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Okay</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Terrible</option>
              </select>
              <textarea placeholder="Write your review" value={reviewText} onChange={e => setReviewText(e.target.value)} style={{ display: 'block', width: '100%', minHeight: 80, marginTop: 8 }} />
              <button className="btn-primary" type="submit" style={{ marginTop: 8 }}>Submit review</button>
            </form>
          </div>
        </div>

        <aside className="course-side" style={{ borderLeft: '1px solid #eee', paddingLeft: 16 }}>
          <div className="instructor-card" style={{ marginBottom: 12 }}>
            <h4>Instructor</h4>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {course.instructor?.avatar || course.instructorAvatar ? (
                <img src={getMediaInfo(course.instructor?.avatar || course.instructorAvatar).url || (course.instructor?.avatar || course.instructorAvatar)} alt="avatar" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
              ) : null}
              <div>
                <div style={{ fontWeight: 600 }}>{course.instructor?.name || course.instructorName}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{course.instructor?.headline || course.instructorBio || ''}</div>
              </div>
            </div>
          </div>

          <div className="course-meta">
            <div><strong>Price:</strong> {course.isFree ? 'Free' : `₹ ${course.price || 0}`}</div>
            <div><strong>Duration:</strong> {course.totalDuration || 0} mins</div>
            <div><strong>Lessons:</strong> {course.totalLessons || (course.lessons && course.lessons.length) || 0}</div>
          </div>
        </aside>
      </div>

      {/* Embedded right-side player panel (small overlay) */}
      {isEmbeddedOpen && (
        <div className="embedded-panel" style={{ position: 'fixed', right: 0, top: 80, width: 420, height: '80%', background: '#fff', boxShadow: '-6px 0 24px rgba(0,0,0,0.08)', padding: 12, zIndex: 2000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Player</h4>
            <button className="btn-secondary" onClick={() => setIsEmbeddedOpen(false)}>Close</button>
          </div>
          <div style={{ marginTop: 8 }}>
              {(() => {
                const mediaInfo = getMediaInfo(course.lessons && course.lessons[currentLessonIndex]?.videoUrl)
                if (!mediaInfo || mediaInfo.type === 'none') return <div>No playable lesson available</div>
                if (mediaInfo.type === 'youtube') {
                  return (
                    <div>
                      <iframe title="lesson-video-embed" src={mediaInfo.url} style={{ width: '100%', height: 240, border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      <div style={{ marginTop: 8 }}>
                        <a href={mediaInfo.externalUrl || mediaInfo.url} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <strong>{course.lessons && course.lessons[currentLessonIndex]?.title}</strong>
                        <div style={{ fontSize: 13, color: '#444' }}>{course.lessons && course.lessons[currentLessonIndex]?.description}</div>
                      </div>
                    </div>
                  )
                }
                return (
                  <>
                    <video controls style={{ width: '100%' }} src={mediaInfo.url} />
                    <div style={{ marginTop: 8 }}>
                      <strong>{course.lessons && course.lessons[currentLessonIndex]?.title}</strong>
                      <div style={{ fontSize: 13, color: '#444' }}>{course.lessons && course.lessons[currentLessonIndex]?.description}</div>
                      {(() => {
                        const notes = course.lessons && course.lessons[currentLessonIndex]?.notes
                        if (!notes) return null
                        const raw = String(notes).trim()
                        if (/^https?:\/\//i.test(raw)) {
                          if (/\.pdf(\?.*)?$/i.test(raw)) {
                            return (<div style={{ marginTop: 8 }}><a href={raw} target="_blank" rel="noopener noreferrer">Open lesson notes (PDF)</a></div>)
                          }
                          return (<div style={{ marginTop: 8 }}><a href={raw} target="_blank" rel="noopener noreferrer">Open lesson notes</a></div>)
                        }
                        return (<div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{raw}</div>)
                      })()}
                    </div>
                  </>
                )
              })()}
          </div>
        </div>
      )}
      <PaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} onPay={handleModalPay} amount={course?.price} />
    </div>
  )
}

  
