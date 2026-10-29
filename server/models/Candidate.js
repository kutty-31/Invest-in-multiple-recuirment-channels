import mongoose from 'mongoose'

const candidateStages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']
const resumeSchema = new mongoose.Schema(
  {
    storageKey: {
      type: String,
      required: true,
      match: /^[0-9a-f-]{36}$/,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 5 * 1024 * 1024,
    },
    contentType: {
      type: String,
      enum: ['application/pdf'],
      required: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
    toJSON: {
      transform(document, result) {
        delete result.storageKey
        return result
      },
    },
    toObject: {
      transform(document, result) {
        delete result.storageKey
        return result
      },
    },
  },
)

const candidateSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Candidate name is required.'],
      trim: true,
      maxlength: [70, 'Candidate name cannot exceed 70 characters.'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot exceed 254 characters.'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },
    role: {
      type: String,
      required: [true, 'Role is required.'],
      trim: true,
      maxlength: [100, 'Role cannot exceed 100 characters.'],
    },
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitingChannel',
      required: [true, 'A recruiting source is required.'],
      index: true,
    },
    stage: {
      type: String,
      enum: {
        values: candidateStages,
        message: 'Stage must be one of: {VALUES}.',
      },
      default: 'Applied',
      required: true,
    },
    qualityScore: {
      type: Number,
      min: [1, 'Quality score must be at least 1.'],
      max: [5, 'Quality score cannot exceed 5.'],
      default: 3,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    hiredAt: {
      type: Date,
      required: [function isRequiredForHiredStage() {
        return this.stage === 'Hired'
      }, 'Hired candidates need a hire date.'],
      validate: {
        validator(value) {
          if (this.stage === 'Hired') {
            return value instanceof Date
              && Number.isFinite(value.getTime())
              && value >= this.appliedAt
          }

          return value == null
        },
        message: 'Hired candidates need a hire date on or after their application date; other stages cannot have a hire date.',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters.'],
    },
    resume: { type: resumeSchema, default: undefined },
  },
  {
    timestamps: true,
    strict: 'throw',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

candidateSchema.index({ stage: 1, appliedAt: -1 })
candidateSchema.index({ source: 1, stage: 1 })

candidateSchema.virtual('daysToHire').get(function getDaysToHire() {
  if (this.stage !== 'Hired' || !this.hiredAt || !this.appliedAt) return null
  return Math.floor((this.hiredAt.getTime() - this.appliedAt.getTime()) / 86400000)
})

const Candidate = mongoose.models.Candidate
  || mongoose.model('Candidate', candidateSchema)

export { candidateStages }
export default Candidate
