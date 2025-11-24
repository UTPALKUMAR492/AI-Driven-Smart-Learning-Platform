import React from 'react'

export const FiEye = (props) => (
  <span aria-hidden className="icon-fi-eye" {...props}>👁️</span>
)

export const FiEyeOff = (props) => (
  <span aria-hidden className="icon-fi-eye-off" {...props}>🙈</span>
)

export const FiLogIn = (props) => (
  <span aria-hidden className="icon-fi-login" {...props}>🔐</span>
)

export default {
  FiEye,
  FiEyeOff,
  FiLogIn
}
