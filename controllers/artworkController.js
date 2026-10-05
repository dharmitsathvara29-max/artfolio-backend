const { uploadImageBuffer } = require('../config/supabase');
const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim()).filter(Boolean);
  try { return JSON.parse(tags); } catch { return tags.split(',').map(t => t.trim()).filter(Boolean); }
};

// GET /api/artworks
exports.getArtworks = async (req, res, next) => {
  try {
    const { tag, artist, category, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    query.status = (status && req.user?.role === 'admin') ? status : { $in: ['approved', 'featured'] };
    if (tag) query.tags = { $in: [new RegExp(tag, 'i')] };
    if (artist) query.artist = artist;
    if (category) query.category = new RegExp(`^${category}$`, 'i');
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

    const skip = (Number(page) - 1) * Number(limit);
    const [total, artworks] = await Promise.all([
      Artwork.countDocuments(query),
      Artwork.find(query).populate('artist', 'name email profileImageUrl').sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    ]);
    res.json({ success: true, total, page: Number(page), data: artworks });
  } catch (err) { next(err); }
};

// GET /api/artworks/:id
exports.getArtworkById = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate('artist', 'name email profileImageUrl bio');
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
    res.json({ success: true, data: artwork });
  } catch (err) { next(err); }
};

// POST /api/artworks  (artist only)
exports.createArtwork = async (req, res, next) => {
  try {
    const { title, description, tags, category, price } = req.body;

    let imageUrl;
    if (req.file) {
      // Real file upload → Supabase Storage
      imageUrl = await uploadImageBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.imageUrl) {
      // Direct URL provided (for Swagger/Postman testing)
      imageUrl = req.body.imageUrl;
    } else {
      // No image at all → use placeholder so testing always works
      imageUrl = 'https://placehold.co/800x600/1a1a2e/ffffff?text=ArtFolio+Artwork';
    }

    const artwork = await Artwork.create({
      title, description, tags: parseTags(tags),
      category: category || 'Digital Art', price: Number(price) || 0,
      imageUrl, artist: req.user.id, status: 'pending'
    });
    res.status(201).json({ success: true, message: 'Artwork submitted for moderation', data: artwork });
  } catch (err) { next(err); }
};

// PUT /api/artworks/:id  (owner)
exports.updateArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const { title, description, tags, category, price } = req.body;
    if (title) artwork.title = title;
    if (description) artwork.description = description;
    if (tags !== undefined) artwork.tags = parseTags(tags);
    if (category) artwork.category = category;
    if (price !== undefined) artwork.price = Number(price);
    if (req.file) artwork.imageUrl = await uploadImageBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    else if (req.body.imageUrl) artwork.imageUrl = req.body.imageUrl;

    await artwork.save();
    res.json({ success: true, message: 'Artwork updated', data: artwork });
  } catch (err) { next(err); }
};

// DELETE /api/artworks/:id  (owner or admin)
exports.deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    await Promise.all([
      Comment.deleteMany({ artwork: artwork._id }),
      Like.deleteMany({ artwork: artwork._id }),
      Artwork.findByIdAndDelete(artwork._id)
    ]);
    res.json({ success: true, message: 'Artwork deleted' });
  } catch (err) { next(err); }
};
