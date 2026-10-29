import mongoose from 'mongoose'

const channelTypes = [
  'linkedin',
  'referral',
  'careers_page',
  'indeed',
  'agency',
  'community_events',
  'other',
]

const recruitingChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required.'],
      trim: true,
      minlength: [2, 'Channel name must have at least 2 characters.'],
      maxlength: [80, 'Channel name cannot exceed 80 characters.'],
    },
    type: {
      type: String,
      enum: {
        values: channelTypes,
        message: 'Channel type must be one of: {VALUES}.',
      },
      default: 'other',
      required: true,
    },
    monthlySpend: {
      type: Number,
      min: [0, 'Monthly spend cannot be negative.'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
  },
  {
    timestamps: true,
    strict: 'throw',
  },
)

recruitingChannelSchema.virtual('candidates', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'source',
})

recruitingChannelSchema.index({ name: 1 }, { unique: true })
recruitingChannelSchema.index({ isActive: 1, type: 1 })

const RecruitingChannel = mongoose.models.RecruitingChannel
  || mongoose.model('RecruitingChannel', recruitingChannelSchema)

export { channelTypes }
export default RecruitingChannel
