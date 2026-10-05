const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'artfolio';

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Validate it's the service_role key, not anon key
  try {
    const payload = JSON.parse(Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64').toString());
    if (payload.role === 'anon') {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is the ANON key — uploads will fail.');
      console.warn('   Go to Supabase → Settings → API → Copy the service_role key instead.');
    } else {
      supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
      });
      console.log(`✅ Supabase Storage ready — bucket: ${BUCKET}`);
    }
  } catch {
    console.warn('⚠️  Could not validate Supabase key. Check SUPABASE_SERVICE_ROLE_KEY in .env');
  }
} else {
  console.warn('⚠️  Supabase not configured. Image uploads will use placeholder URLs.');
}

const uploadImageBuffer = async (buffer, originalName, mimetype) => {
  const ext = path.extname(originalName) || '.jpg';
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const filePath = `artworks/${Date.now()}_${name}${ext}`;

  if (!supabase) {
    // Return a working placeholder so API testing doesn't break
    return `https://placehold.co/800x600/1a1a2e/ffffff?text=ArtFolio+Artwork`;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl;
};

module.exports = { supabase, uploadImageBuffer };
