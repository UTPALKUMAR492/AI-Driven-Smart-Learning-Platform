import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['success', 'rejected', 'pending'], required: true },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Payment', PaymentSchema)
