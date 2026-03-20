import React from 'react'
import './StudentToolbar.css'

export default function StudentToolbar({ onShare, onEnroll, onWishlist, onReport, isEnrolled, isInWishlist }){
  return (
    <div className="st-toolbar">
      <div className="st-left">
        <button className="st-btn st-primary" onClick={onEnroll}>{isEnrolled ? 'Continue learning' : 'Enroll / Start'}</button>
      </div>
      <div className="st-right">
        <button className={`st-icon ${isInWishlist ? 'active' : ''}`} title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'} onClick={onWishlist}>{isInWishlist ? '♥' : '♡'}</button>
        <button className="st-icon" title="Share" onClick={onShare}>Share</button>
        <button className="st-icon" title="Report issue" onClick={onReport}>Report</button>
      </div>
    </div>
  )
}
