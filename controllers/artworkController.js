const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const { uploadImageBuffer } = require('../config/supabase');

/**
 * Helper to parse tags from array, string, or comma-separated string
 */
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map((t) => t.trim()).filter(Boolean);
    } catch {
      return tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * @desc    Get all artworks (filtered by tag, artist, category, or status if admin)
 * @route   GET /api/artworks
 * @access  Public
 */
const getArtworks = async (req, res, next) => {
  try {
    const { tag, artist, category, status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Status filter:
    // By default, only show 'approved' or 'featured' artworks.
    // If admin is authenticated and passed a status query, honor that status.
    if (status && req.user && req.user.role === 'admin') {
      query.status = status;
    } else {
      query.status = { $in: ['approved', 'featured'] };
    }

    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    if (artist) {
      query.artist = artist;
    }

    if (category) {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Artwork.countDocuments(query);
    const artworks = await Artwork.find(query)
      .populate('artist', 'name email profileImageUrl bio portfolioTags')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: artworks.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: artworks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single artwork by ID
 * @route   GET /api/artworks/:id
 * @access  Public
 */
const getArtworkById = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate(
      'artist',
      'name email profileImageUrl bio portfolioTags'
    );

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    res.status(200).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new artwork (Artist only)
 * @route   POST /api/artworks
 * @access  Protected (Role: artist)
 */
const createArtwork = async (req, res, next) => {
  try {
    const { title, description, tags, category, price } = req.body;

    let imageUrl = req.body.imageUrl;

    // Handle file upload to Firebase Storage if an image file was uploaded
    if (req.file) {
      imageUrl = await uploadImageBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Artwork image is required. Please upload an image file or provide an imageUrl'
      });
    }

    const artwork = await Artwork.create({
      title: title.trim(),
      description: description.trim(),
      tags: parseTags(tags),
      category: category || 'Digital Art',
      price: price ? Number(price) : 0,
      imageUrl,
      artist: req.user.id,
      status: 'pending' // pending until moderated by admin
    });

    const populatedArtwork = await Artwork.findById(artwork._id).populate(
      'artist',
      'name email profileImageUrl bio'
    );

    res.status(201).json({
      success: true,
      message: 'Artwork uploaded successfully and submitted for moderation',
      data: populatedArtwork
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update artwork details (Owner only)
 * @route   PUT /api/artworks/:id
 * @access  Protected (Owner only)
 */
const updateArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Check ownership
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this artwork'
      });
    }

    const { title, description, tags, category, price } = req.body;

    if (title) artwork.title = title.trim();
    if (description) artwork.description = description.trim();
    if (tags !== undefined) artwork.tags = parseTags(tags);
    if (category) artwork.category = category.trim();
    if (price !== undefined) artwork.price = Number(price);

    // If a new image was uploaded, upload to Firebase Storage and update imageUrl
    if (req.file) {
      artwork.imageUrl = await uploadImageBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } else if (req.body.imageUrl) {
      artwork.imageUrl = req.body.imageUrl;
    }

    await artwork.save();

    const updated = await Artwork.findById(artwork._id).populate(
      'artist',
      'name email profileImageUrl bio'
    );

    res.status(200).json({
      success: true,
      message: 'Artwork updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete artwork & cascade delete comments/likes (Owner or Admin)
 * @route   DELETE /api/artworks/:id
 * @access  Protected (Owner or Admin)
 */
const deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Check ownership or admin status
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this artwork'
      });
    }

    // Cascade delete comments and likes associated with this artwork
    await Promise.all([
      Comment.deleteMany({ artwork: artwork._id }),
      Like.deleteMany({ artwork: artwork._id }),
      Artwork.findByIdAndDelete(artwork._id)
    ]);

    res.status(200).json({
      success: true,
      message: 'Artwork and associated comments and likes deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork
};
