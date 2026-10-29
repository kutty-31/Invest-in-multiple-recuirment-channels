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
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters.'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters.'],
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

userSchema.pre('validate', function validateAuthenticationMethod(next) {
  if (this.googleId) return next()
  if (this.username && this.passwordHash) return next()
  this.invalidate('passwordHash', 'A password is required for username authentication.')
  return next()
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
