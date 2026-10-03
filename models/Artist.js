const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const ArtistSchema = new Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:    { type: String, required: true },
  role:            { type: String, enum: ['artist', 'visitor', 'admin'], default: 'visitor' },
  bio:             { type: String, default: '', maxlength: 1000 },
  profileImageUrl: { type: String, default: '' },
  portfolioTags:   { type: [String], default: [] }
}, { timestamps: true });

ArtistSchema.methods.isValidPassword = function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};

ArtistSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = model('Artist', ArtistSchema);
