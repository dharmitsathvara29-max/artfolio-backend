const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: [true, 'Artwork reference is required']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Comment author is required']
    },
    text: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

CommentSchema.index({ artwork: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
