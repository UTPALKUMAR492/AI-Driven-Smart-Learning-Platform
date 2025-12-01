import api from './axiosConfig'

/**
 * Student API wrapper
 * - Consumes endpoints from /api/student/*
 */

const extract = (res) => res?.data
const extractError = (err) => {
  if (err?.response?.data) throw err.response.data
  throw err
}

export const getStudentStats = async () => {
  try {
    const res = await api.get('/student/stats')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getRecentActivity = async () => {
  try {
    const res = await api.get('/student/recent')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getRecommendations = async () => {
  try {
    const res = await api.get('/student/recommendations')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getQuizHistory = async () => {
  try {
    const res = await api.get('/student/quiz-history')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getResult = async (resultId) => {
  try {
    const res = await api.get(`/student/results/${resultId}`)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getLearningProgress = async () => {
  try {
    const res = await api.get('/student/progress')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getEnrolledCourses = async () => {
  try {
    const res = await api.get('/student/enrolled-courses')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export const getWishlist = async () => {
  try {
    const res = await api.get('/student/wishlist')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export default {
  getStudentStats,
  getRecentActivity,
  getRecommendations,
  getQuizHistory,
  getResult,
  getLearningProgress,
  getEnrolledCourses,
  getWishlist
}
