const { Schema, model } = require('mongoose');

const ArtworkSchema = new Schema({
  title:         { type: String, required: true, trim: true, maxlength: 200 },
  description:   { type: String, required: true, maxlength: 3000 },
  tags:          { type: [String], default: [] },
  imageUrl:      { type: String, required: true },
  artist:        { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  category:      { type: String, default: 'Digital Art', trim: true },
  price:         { type: Number, default: 0, min: 0 },
  likesCount:    { type: Number, default: 0, min: 0 },
  commentsCount: { type: Number, default: 0, min: 0 },
  status:        { type: String, enum: ['pending', 'approved', 'rejected', 'featured'], default: 'pending' }
}, { timestamps: true });

ArtworkSchema.index({ status: 1, createdAt: -1 });
ArtworkSchema.index({ tags: 1 });
ArtworkSchema.index({ artist: 1 });

module.exports = model('Artwork', ArtworkSchema);
