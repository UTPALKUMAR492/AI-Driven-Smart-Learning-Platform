import api from './axiosConfig'

export const createDummyPayment = async ({ courseId, amount = 0, status = 'success', metadata = {} }) => {
  try {
    const res = await api.post('/payments/dummy', { courseId, amount, status, metadata })
    return res.data
  } catch (err) {
    console.error('Error creating dummy payment', err)
    throw err
  }
}

export const getUserPayments = async () => {
  try {
    const res = await api.get('/payments/user')
    return res.data
  } catch (err) {
    console.error('Error fetching payments', err)
    throw err
  }
}

export default { createDummyPayment, getUserPayments }
