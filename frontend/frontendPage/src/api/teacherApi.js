import api from './axiosConfig'

// AI: Generate questions for a course using OpenAI
export const generateQuestionsAI = async ({ courseId, topic, numQuestions }) => {
  try {
    const res = await api.post('/ai/question/generate-questions', { courseId, topic, numQuestions });
    return extract(res);
  } catch (err) { extractError(err); }
};

const extract = (res) => res?.data
const extractError = (err) => {
  if (err?.response?.data) throw err.response.data
  throw err
}

/* ===========================
      TEACHER DASHBOARD API
=========================== */

// Teacher stats
export const getTeacherStats = async () => {
  try {
    const res = await api.get('/teacher/stats')
    return extract(res)
  } catch (err) { extractError(err) }
}

// Teacher courses
export const getTeacherCourses = async () => {
  try {
    const res = await api.get('/teacher/courses')
    return extract(res)
  } catch (err) { extractError(err) }
}

// Teacher quizzes
export const getTeacherQuizzes = async () => {
  try {
    const res = await api.get('/teacher/quizzes')
    return extract(res)
  } catch (err) { extractError(err) }
}

// Get quiz results (teacher view)
export const getQuizResults = async (quizId) => {
  try {
    const res = await api.get(`/teacher/quizzes/${quizId}/results`)
    return extract(res)
  } catch (err) { extractError(err) }
}

// Get a specific result details (uses student route)
export const getResultDetails = async (resultId) => {
  try {
    const res = await api.get(`/student/results/${resultId}`)
    return extract(res)
  } catch (err) { extractError(err) }
}

// Teacher students
export const getTeacherStudents = async () => {
  try {
    const res = await api.get('/teacher/students')
    return extract(res)
  } catch (err) { extractError(err) }
}


/* ===========================
         COURSE API
=========================== */

// CREATE COURSE (correct backend route)
export const createCourse = async (courseData) => {
  try {
    const res = await api.post('/teacher/courses', courseData)
    return extract(res)
  } catch (err) { extractError(err) }
}

// UPDATE COURSE
export const updateCourse = async (courseId, courseData) => {
  try {
    const res = await api.put(`/teacher/courses/${courseId}`, courseData)
    return extract(res)
  } catch (err) { extractError(err) }
}

// DELETE COURSE
export const deleteCourse = async (courseId) => {
  try {
    const res = await api.delete(`/teacher/courses/${courseId}`)
    return extract(res)
  } catch (err) { extractError(err) }
}

// PUBLISH / UNPUBLISH COURSE
export const toggleCoursePublish = async (courseId) => {
  try {
    const res = await api.put(`/teacher/courses/${courseId}/publish`)
    return extract(res)
  } catch (err) { extractError(err) }
}


/* ===========================
           QUIZ API
=========================== */

// CREATE QUIZ (your backend route is /quiz)
export const createQuiz = async (quizData) => {
  try {
    const res = await api.post('/quiz', quizData)
    return extract(res)
  } catch (err) { extractError(err) }
}

// UPDATE QUIZ
export const updateQuiz = async (quizId, quizData) => {
  try {
    const res = await api.put(`/quiz/${quizId}`, quizData)
    return extract(res)
  } catch (err) { extractError(err) }
}

// DELETE QUIZ
export const deleteQuiz = async (quizId) => {
  try {
    const res = await api.delete(`/quiz/${quizId}`)
    return extract(res)
  } catch (err) { extractError(err) }
}

// PUBLISH / UNPUBLISH QUIZ
export const toggleQuizPublish = async (quizId) => {
  try {
    const res = await api.put(`/teacher/quizzes/${quizId}/publish`)
    return extract(res)
  } catch (err) { extractError(err) }
}


/* ===========================
       COURSE ANALYTICS
=========================== */

export const getCourseAnalytics = async (courseId) => {
  try {
    const res = await api.get(`/teacher/courses/${courseId}/analytics`)
    return extract(res)
  } catch (err) { extractError(err) }
}


export default {
  getTeacherStats,
  getTeacherCourses,
  getTeacherQuizzes,
  getTeacherStudents,
  getQuizResults,
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
