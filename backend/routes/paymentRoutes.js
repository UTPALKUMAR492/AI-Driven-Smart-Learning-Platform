import express from 'express'
import { createDummyPayment, getUserPayments } from '../controllers/paymentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST /api/payments/dummy -> create a dummy payment record
router.post('/dummy', protect, createDummyPayment)

// GET /api/payments/user -> list payments for current user
router.get('/user', protect, getUserPayments)

export default router
