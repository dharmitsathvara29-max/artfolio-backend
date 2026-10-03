const { Schema, model } = require('mongoose');

const NotificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  type:      { type: String, enum: ['new_comment', 'new_like', 'new_commission', 'sale_recorded'], required: true },
  message:   { type: String, required: true, trim: true },
  relatedId: { type: Schema.Types.ObjectId, default: null },
  read:      { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = model('Notification', NotificationSchema);
