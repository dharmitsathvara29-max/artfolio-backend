const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'artfolio';

let supabase = null;
let isInitialized = false;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    // Service role key bypasses Row Level Security for server-side uploads
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
    isInitialized = true;
    console.log(`✅ Supabase Storage initialized with bucket: ${SUPABASE_STORAGE_BUCKET}`);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn(
    '⚠️ Supabase not initialized: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.\n' +
    '   File uploads will use a local placeholder URL fallback.\n' +
    '   See .env.example for setup instructions.'
  );
}

/**
 * Upload an image buffer to Supabase Storage.
 * Returns a public URL for the uploaded file.
 *
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} originalName - Original filename (for extension detection)
 * @param {string} mimetype - MIME type (e.g. image/jpeg, image/png)
 * @returns {Promise<string>} Public URL of the uploaded image
 */
const uploadImageBuffer = async (buffer, originalName, mimetype) => {
  const extension = path.extname(originalName) || '.jpg';
  const cleanBaseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `artworks/${Date.now()}_${cleanBaseName}${extension}`;

  if (!isInitialized || !supabase) {
    console.warn('⚠️ Supabase Storage not initialized. Generating fallback mock URL for testing.');
    return `https://<your-project>.supabase.co/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${filename}`;
  }

  const { data, error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Build the public URL
  const { data: publicData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

module.exports = {
  supabase,
  isInitialized: () => isInitialized,
  uploadImageBuffer,
  SUPABASE_STORAGE_BUCKET
};
