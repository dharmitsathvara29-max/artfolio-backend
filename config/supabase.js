const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'artfolio';

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
  console.log(`✅ Supabase Storage ready — bucket: ${BUCKET}`);
} else {
  console.warn('⚠️  Supabase not configured. Add SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY to .env');
}

const uploadImageBuffer = async (buffer, originalName, mimetype) => {
  const ext = path.extname(originalName) || '.jpg';
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const filePath = `artworks/${Date.now()}_${name}${ext}`;

  if (!supabase) {
    return `https://placeholder.supabase.co/storage/v1/object/public/${BUCKET}/${filePath}`;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl;
};

module.exports = { supabase, uploadImageBuffer };
