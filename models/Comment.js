const { Schema, model } = require('mongoose');

const CommentSchema = new Schema({
  artwork: { type: Schema.Types.ObjectId, ref: 'Artwork', required: true },
  author:  { type: Schema.Types.ObjectId, ref: 'Artist',  required: true },
  text:    { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

CommentSchema.index({ artwork: 1, createdAt: -1 });

module.exports = model('Comment', CommentSchema);
