import api from './axiosConfig';

// Get all quizzes with optional filters
export const getAllQuizzes = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    
    const response = await api.get(`/quiz?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// Get a single quiz by ID
export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
  }
};

// Submit quiz answers
export const submitQuiz = async (quizId, responses) => {
  try {
    const response = await api.post(`/quiz/${quizId}/submit`, { responses });
    return response.data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

// Get quiz result by result ID
export const getQuizResult = async (resultId) => {
  try {
    const response = await api.get(`/student/results/${resultId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching result:', error);
    throw error;
  }
};

// Get user's quiz history
export const getUserQuizHistory = async () => {
  try {
    const response = await api.get('/student/quiz-history');
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    throw error;
  }
};

export default {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResult,
  getUserQuizHistory
};
