import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must have at least 3 characters.'],
      maxlength: [30, 'Username cannot exceed 30 characters.'],
      match: [/^[a-z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, and hyphens.'],
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    strict: 'throw',
    toJSON: {
      transform(document, result) {
        delete result.passwordHash
        return result
      },
    },
  },
)

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
