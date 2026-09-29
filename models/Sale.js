const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: [true, 'Artwork reference is required']
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: [true, 'Artist reference is required']
    },
    buyerName: {
      type: String,
      required: [true, 'Buyer name is required'],
      trim: true
    },
    buyerEmail: {
      type: String,
      required: [true, 'Buyer email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid buyer email']
    },
    amount: {
      type: Number,
      required: [true, 'Sale amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    saleType: {
      type: String,
      enum: ['print', 'original'],
      default: 'print'
    }
  },
  {
    timestamps: true
  }
);

SaleSchema.index({ artist: 1, createdAt: -1 });
SaleSchema.index({ artwork: 1 });

module.exports = mongoose.model('Sale', SaleSchema);
