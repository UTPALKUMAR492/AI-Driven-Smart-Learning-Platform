import api from './axiosConfig'

const extract = (res) => res?.data
const extractError = (err) => {
  if (err?.response?.data) throw err.response.data
  throw err
}

// Get teacher dashboard stats
export const getTeacherStats = async () => {
  try {
    const res = await api.get('/teacher/stats')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Get teacher's courses
export const getTeacherCourses = async () => {
  try {
    const res = await api.get('/teacher/courses')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Get teacher's quizzes
export const getTeacherQuizzes = async () => {
  try {
    const res = await api.get('/teacher/quizzes')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Get students enrolled in teacher's courses
export const getTeacherStudents = async () => {
  try {
    const res = await api.get('/teacher/students')
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Publish/Unpublish course
export const toggleCoursePublish = async (courseId) => {
  try {
    const res = await api.put(`/teacher/courses/${courseId}/publish`)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Publish/Unpublish quiz
export const toggleQuizPublish = async (quizId) => {
  try {
    const res = await api.put(`/teacher/quizzes/${quizId}/publish`)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Get course analytics
export const getCourseAnalytics = async (courseId) => {
  try {
    const res = await api.get(`/teacher/courses/${courseId}/analytics`)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Create course
export const createCourse = async (courseData) => {
  try {
    const res = await api.post('/courses', courseData)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Update course
export const updateCourse = async (courseId, courseData) => {
  try {
    const res = await api.put(`/courses/${courseId}`, courseData)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Delete course
export const deleteCourse = async (courseId) => {
  try {
    const res = await api.delete(`/courses/${courseId}`)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Create quiz
export const createQuiz = async (quizData) => {
  try {
    const res = await api.post('/quiz', quizData)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Update quiz
export const updateQuiz = async (quizId, quizData) => {
  try {
    const res = await api.put(`/quiz/${quizId}`, quizData)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

// Delete quiz
export const deleteQuiz = async (quizId) => {
  try {
    const res = await api.delete(`/quiz/${quizId}`)
    return extract(res)
  } catch (err) {
    extractError(err)
  }
}

export default {
  getTeacherStats,
  getTeacherCourses,
  getTeacherQuizzes,
  getTeacherStudents,
  toggleCoursePublish,
  toggleQuizPublish,
  getCourseAnalytics,
  createCourse,
  updateCourse,
  deleteCourse,
  createQuiz,
  updateQuiz,
  deleteQuiz
}
