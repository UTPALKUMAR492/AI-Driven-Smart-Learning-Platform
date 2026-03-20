import api from './axiosConfig';

// AI: Generate questions for a course using OpenAI (admin)
export const generateQuestionsAIAdmin = async ({ courseId, topic, numQuestions }) => {
  try {
    const res = await api.post('/ai/question/generate-questions', { courseId, topic, numQuestions });
    return res.data;
  } catch (err) {
    if (err?.response?.data) throw err.response.data;
    throw err;
  }
};

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

export const getPendingCourses = async (params = {}) => {
  try {
    const response = await api.get('/admin/courses', { params: { ...params, isPublished: 'false' } });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending courses:', error);
    throw error;
  }
}

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

// Set course publish status (pass `publish` boolean)
export const toggleCoursePublish = async (courseId, publish = undefined) => {
  try {
    // Call public course route which accepts { publish: boolean } in body
    const payload = (publish === undefined) ? {} : { publish };
    const response = await api.put(`/courses/${courseId}/publish`, payload);
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

// Admin delete course (uses public course delete route; requires admin)
export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

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

// Get quiz results (admin view)
export const getQuizResultsAdmin = async (quizId) => {
  try {
    const response = await api.get(`/admin/quizzes/${quizId}/results`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    throw error;
  }
};

// Get analytics (wrapper around stats for charts)
export const getAnalytics = async () => {
  try {
    const response = await api.get('/admin/stats');
    // backend returns monthlyEnrollments and other stats
    return response.data?.monthlyEnrollments || null;
  } catch (error) {
    console.error('Error fetching analytics:', error);
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
  ,getAnalytics
};

export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}