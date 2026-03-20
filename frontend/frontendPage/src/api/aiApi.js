import api from './axiosConfig'

export const generateQuiz = (payload) => api.post('/ai/generate-quiz', payload)
export const getRecommendations = () => api.get('/ai/recommendations')

export default { generateQuiz, getRecommendations }
