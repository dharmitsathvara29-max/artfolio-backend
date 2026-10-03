const { Schema, model } = require('mongoose');

const CommissionSchema = new Schema({
  artist:      { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  requester:   { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  budget:      { type: Number, required: true, min: 1 },
  status:      { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' }
}, { timestamps: true });

CommissionSchema.index({ artist: 1, createdAt: -1 });

module.exports = model('Commission', CommissionSchema);
