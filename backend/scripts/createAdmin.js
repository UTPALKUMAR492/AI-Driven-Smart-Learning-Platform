import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import User from '../models/User.js'

dotenv.config()

const run = async () => {
  try {
    await connectDB()
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    const name = process.env.ADMIN_NAME || 'Admin'

    if (!email || !password) {
      console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env to create an admin.')
      process.exit(1)
    }

    let user = await User.findOne({ email })
    if (user) {
      user.role = 'admin'
      // update password only if provided in env (will be hashed by pre-save)
      if (password) user.password = password
      await user.save()
      console.log(`Updated existing user to admin: ${email}`)
    } else {
      user = new User({ name, email, password, role: 'admin' })
      await user.save()
      console.log(`Created new admin user: ${email}`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Failed to create admin:', err)
    process.exit(1)
  }
}

run()
