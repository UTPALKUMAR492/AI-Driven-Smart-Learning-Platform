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
    // Normalize the error for the UI: include status and server message if available
    const serverMessage = error?.response?.data?.message;
    const status = error?.response?.status;
    const normalized = new Error(serverMessage || error.message || 'Enrollment failed');
    if (status) normalized.status = status;
    if (error?.response?.data) normalized.info = error.response.data;
    throw normalized;
  }
};

// Enroll in course
export const enrollInCourse = enrollCourse;

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

// Remove from wishlist
export const removeFromWishlist = async (courseId) => {
  try {
    // Replace with actual API endpoint if available
    const response = await api.delete(`/courses/${courseId}/wishlist`);
    return response.data;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
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

// Rate a course
export const rateCourse = async (courseId, rating) => {
  try {
    // Accept either a number or an object { rating, comment }
    const payload = typeof rating === 'number' ? { rating } : rating || {};
    const response = await api.post(`/courses/${courseId}/rate`, payload);
    return response.data;
  } catch (error) {
    console.error('Error rating course:', error);
    throw error;
  }
};

// Simple client-side cart (localStorage) helpers
export const addToCart = async (course) => {
  try {
    const key = 'smartedu_cart_v1'
    const raw = localStorage.getItem(key)
    const cart = raw ? JSON.parse(raw) : []
    // prevent duplicates by course id
    if (!cart.find(c => c._id === course._id)) cart.push(course)
    localStorage.setItem(key, JSON.stringify(cart))
    return cart
  } catch (err) {
    console.error('Error adding to cart:', err)
    throw err
  }
}

// Server-side cart helpers (requires authenticated user)
export const addToCartServer = async (courseId) => {
  try {
    const response = await api.post('/student/cart', { courseId });
    return response.data;
  } catch (err) {
    console.error('Error adding to server cart:', err);
    throw err;
  }
}

export const getCartServer = async () => {
  try {
    const response = await api.get('/student/cart');
    return response.data;
  } catch (err) {
    console.error('Error fetching server cart:', err);
    throw err;
  }
}

export const removeFromCartServer = async (courseId) => {
  try {
    const response = await api.delete(`/student/cart/${courseId}`);
    return response.data;
  } catch (err) {
    console.error('Error removing from server cart:', err);
    throw err;
  }
}

export const getCart = () => {
  try {
    const raw = localStorage.getItem('smartedu_cart_v1')
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Error reading cart:', err)
    return []
  }
}

export const removeFromCart = (courseId) => {
  try {
    const key = 'smartedu_cart_v1'
    const raw = localStorage.getItem(key)
    const cart = raw ? JSON.parse(raw) : []
    const next = cart.filter(c => c._id !== courseId)
    localStorage.setItem(key, JSON.stringify(next))
    return next
  } catch (err) {
    console.error('Error removing from cart:', err)
    return []
  }
}

// Named export for dynamic import compatibility
export const addToWishlist = toggleWishlist;

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
