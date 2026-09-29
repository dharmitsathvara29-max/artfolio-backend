const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let bucket = null;
let isInitialized = false;

try {
  let credential = null;
  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    // Mode A: Local development file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
    console.log('ℹ️ Firebase Admin: Loaded credentials from local serviceAccountKey.json');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Mode B: Production / Render environment variable
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
      console.log('ℹ️ Firebase Admin: Loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var');
    } catch (parseErr) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseErr.message);
    }
  }

  if (credential) {
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'artfolio-backend.appspot.com';
    admin.initializeApp({
      credential,
      storageBucket
    });
    bucket = admin.storage().bucket();
    isInitialized = true;
    console.log(`✅ Firebase Admin initialized with bucket: ${storageBucket}`);
  } else {
    console.warn(
      '⚠️ Firebase Admin not initialized: No serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_JSON found. File uploads will use local placeholder fallback.'
    );
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
}

/**
 * Upload an image buffer to Firebase Storage.
 * In case Firebase credentials are not yet configured, provides a deterministic local/mock URL fallback.
 * 
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} originalName - Original filename
 * @param {string} mimetype - MIME type (e.g. image/png, image/jpeg)
 * @returns {Promise<string>} Public URL of the uploaded image
 */
const uploadImageBuffer = async (buffer, originalName, mimetype) => {
  const extension = path.extname(originalName) || '.jpg';
  const cleanBaseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `artworks/${Date.now()}_${cleanBaseName}${extension}`;

  if (!isInitialized || !bucket) {
    console.warn('⚠️ Firebase Storage is not initialized. Generating fallback mock URL for testing.');
    return `https://storage.googleapis.com/artfolio-backend.appspot.com/${filename}`;
  }

  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      metadata: {
        firebaseStorageDownloadTokens: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
    },
    resumable: false
  });

  try {
    // Make the file publicly accessible
    await file.makePublic();
    // Return standard public URL
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  } catch (publicErr) {
    // Alternatively return signed URL if makePublic is restricted by bucket uniform bucket-level access
    console.warn('makePublic() had an issue or uniform access is enabled, generating signed URL:', publicErr.message);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-17-2035'
    });
    return signedUrl;
  }
};

module.exports = {
  admin,
  bucket,
  isInitialized: () => isInitialized,
  uploadImageBuffer
};
