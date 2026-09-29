const mongoose = require('mongoose');

const ArtworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an artwork title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide an artwork description'],
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    tags: {
      type: [String],
      default: []
    },
    imageUrl: {
      type: String,
      required: [true, 'Artwork image URL is required']
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Artwork must belong to an artist']
    },
    category: {
      type: String,
      default: 'Digital Art',
      trim: true
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    },
    likesCount: {
      type: Number,
      default: 0,
      min: [0, 'Likes count cannot be negative']
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: [0, 'Comments count cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'featured'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
ArtworkSchema.index({ status: 1, createdAt: -1 });
ArtworkSchema.index({ tags: 1 });
ArtworkSchema.index({ category: 1 });
ArtworkSchema.index({ artist: 1 });

module.exports = mongoose.model('Artwork', ArtworkSchema);
