import api from './axiosConfig';

// Get all courses with filters
export const getAllCourses = async (params = {}) => {
  try {
    const response = await api.get('/courses', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

// Get featured courses
export const getFeaturedCourses = async () => {
  try {
    const response = await api.get('/courses/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    throw error;
  }
};

// Get categories
export const getCategories = async () => {
  try {
    const response = await api.get('/courses/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Enroll in course
export const enrollCourse = async (courseId) => {
  try {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

// Get enrolled courses
export const getEnrolledCourses = async () => {
  try {
    const response = await api.get('/courses/user/enrolled');
    return response.data;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

// Update lesson progress
export const updateProgress = async (courseId, lessonId, data) => {
  try {
    const response = await api.put(`/courses/${courseId}/progress/${lessonId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

// Add review
export const addReview = async (courseId, reviewData) => {
  try {
    const response = await api.post(`/courses/${courseId}/review`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

// Toggle wishlist
export const toggleWishlist = async (courseId) => {
  try {
    const response = await api.post(`/courses/${courseId}/wishlist`);
    return response.data;
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    throw error;
  }
};

// Get wishlist
export const getWishlist = async () => {
  try {
    const response = await api.get('/courses/user/wishlist');
    return response.data;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
};

export default {
  getAllCourses,
  getCourseById,
  getFeaturedCourses,
  getCategories,
  enrollCourse,
  getEnrolledCourses,
  updateProgress,
  addReview,
  toggleWishlist,
  getWishlist
};
