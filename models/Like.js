const { Schema, model } = require('mongoose');

const LikeSchema = new Schema({
  artwork: { type: Schema.Types.ObjectId, ref: 'Artwork', required: true },
  user:    { type: Schema.Types.ObjectId, ref: 'Artist',  required: true }
}, { timestamps: true });

// Prevents a user from liking the same artwork twice
LikeSchema.index({ artwork: 1, user: 1 }, { unique: true });

module.exports = model('Like', LikeSchema);
