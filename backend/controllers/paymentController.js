import Payment from '../models/Payment.js'
import Course from '../models/Course.js'

// Create a dummy payment record
export const createDummyPayment = async (req, res) => {
  try {
    const { courseId, amount = 0, status = 'success', metadata = {} } = req.body
    const userId = req.user._id

    if (!courseId) return res.status(400).json({ message: 'courseId required' })

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const payment = await Payment.create({
      user: userId,
      course: courseId,
      amount: Number(amount) || 0,
      status: status === 'rejected' ? 'rejected' : 'success',
      metadata
    })

    return res.status(201).json({ message: 'Payment recorded', payment })
  } catch (err) {
    return res.status(500).json({ message: 'Could not record payment', error: err.message })
  }
}

export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id
    const payments = await Payment.find({ user: userId }).populate('course', 'title thumbnail')
    return res.json(payments)
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch payments', error: err.message })
  }

}
