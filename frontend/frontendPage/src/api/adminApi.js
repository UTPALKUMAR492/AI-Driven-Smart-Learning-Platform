import api from './axiosConfig';

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get all courses
export const getAllCourses = async (params = {}) => {
  try {
    const response = await api.get('/admin/courses', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Create new course
export const createCourse = async (courseData) => {
  try {
    const response = await api.post('/admin/course', courseData);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Toggle course publish
export const toggleCoursePublish = async (courseId) => {
  try {
    const response = await api.put(`/admin/courses/${courseId}/publish`);
    return response.data;
  } catch (error) {
    console.error('Error toggling publish:', error);
    throw error;
  }
};

// Toggle featured
export const toggleFeatured = async (courseId) => {
  try {
    const response = await api.put(`/admin/courses/${courseId}/featured`);
    return response.data;
  } catch (error) {
    console.error('Error toggling featured:', error);
    throw error;
  }
};

// Get all quizzes
export const getAllQuizzes = async (params = {}) => {
  try {
    const response = await api.get('/admin/quizzes', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// Create new quiz
export const createQuiz = async (quizData) => {
  try {
    const response = await api.post('/admin/quiz', quizData);
    return response.data;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Delete quiz
export const deleteQuiz = async (quizId) => {
  try {
    const response = await api.delete(`/admin/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllCourses,
  createCourse,
  toggleCoursePublish,
  toggleFeatured,
  getAllQuizzes,
  createQuiz,
  deleteQuiz
};