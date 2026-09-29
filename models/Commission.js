const mongoose = require('mongoose');

const CommissionSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Commissioned artist is required']
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Commission requester is required']
    },
    description: {
      type: String,
      required: [true, 'Commission description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    budget: {
      type: Number,
      required: [true, 'Commission budget is required'],
      min: [1, 'Budget must be at least 1']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

CommissionSchema.index({ artist: 1, createdAt: -1 });
CommissionSchema.index({ requester: 1, createdAt: -1 });

module.exports = mongoose.model('Commission', CommissionSchema);
