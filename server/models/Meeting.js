import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, 'Please provide a room ID'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a meeting title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    privacy: {
      type: String,
      enum: ['public', 'org'],
      default: 'public',
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['live', 'ended'],
      default: 'live',
      index: true,
    },
    whiteboardData: {
      type: String, // Serialized JSON string of strokes
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    participants: [participantSchema],
  },
  {
    timestamps: true,
  }
);

// Helpful index for my-meetings queries
meetingSchema.index({ 'participants.user': 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
