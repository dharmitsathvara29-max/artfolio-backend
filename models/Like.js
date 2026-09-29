const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: [true, 'Artwork reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'User reference is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a user can only like an artwork once
LikeSchema.index({ artwork: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);
