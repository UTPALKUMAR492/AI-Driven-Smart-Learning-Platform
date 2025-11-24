import React from 'react'

// Lightweight fallback components to satisfy imports when `swiper` is not installed.
export const Swiper = ({ children, className = '', style = {}, ...rest }) => {
  return (
    <div className={`fallback-swiper ${className}`} style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, ...style }} {...rest}>
      {children}
    </div>
  )
}

export const SwiperSlide = ({ children, className = '', style = {}, ...rest }) => {
  return (
    <div className={`fallback-swiper-slide ${className}`} style={{ minWidth: 220, flex: '0 0 auto', ...style }} {...rest}>
      {children}
    </div>
  )
}
