import mongoose from 'mongoose'

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is required to connect the Talentwise API to MongoDB.')
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  })

  return mongoose.connection
}

export default connectDatabase
