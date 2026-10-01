const fs = require('fs');
const path = require('path');

const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ARTWORK_DIR = path.join(UPLOAD_ROOT, 'artworks');

/**
 * Save an image buffer to the local /uploads/artworks folder.
 * Same signature as the Firebase version, so the controller doesn't change.
 */
const uploadImageBufferLocal = async (buffer, originalName, mimetype) => {
  await fs.promises.mkdir(ARTWORK_DIR, { recursive: true });

  const extension = path.extname(originalName) || '.jpg';
  const cleanBaseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${Date.now()}_${cleanBaseName}${extension}`;

  await fs.promises.writeFile(path.join(ARTWORK_DIR, filename), buffer);

  const baseUrl =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  return `${baseUrl}/uploads/artworks/${filename}`;
};

let uploadImageBuffer;

if (provider === 'firebase') {
  // Only loaded when you explicitly choose Firebase
  uploadImageBuffer = require('./firebase').uploadImageBuffer;
} else {
  uploadImageBuffer = uploadImageBufferLocal;
}

module.exports = { uploadImageBuffer, provider };