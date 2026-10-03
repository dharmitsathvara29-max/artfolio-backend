const { Schema, model } = require('mongoose');

const SaleSchema = new Schema({
  artwork:    { type: Schema.Types.ObjectId, ref: 'Artwork', required: true },
  artist:     { type: Schema.Types.ObjectId, ref: 'Artist',  required: true },
  buyerName:  { type: String, required: true, trim: true },
  buyerEmail: { type: String, required: true, lowercase: true, trim: true },
  amount:     { type: Number, required: true, min: 0 },
  saleType:   { type: String, enum: ['print', 'original'], default: 'print' }
}, { timestamps: true });

SaleSchema.index({ artist: 1, createdAt: -1 });

module.exports = model('Sale', SaleSchema);
