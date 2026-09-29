const Artist = require('../models/Artist');
const Artwork = require('../models/Artwork');

/**
 * @desc    List all artists
 * @route   GET /api/artists
 * @access  Public
 */
const getArtists = async (req, res, next) => {
  try {
    const { tag, search, page = 1, limit = 20 } = req.query;

    const query = { role: 'artist' };

    if (tag) {
      query.portfolioTags = { $in: [new RegExp(tag, 'i')] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Artist.countDocuments(query);
    const artists = await Artist.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: artists.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: artists
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get artist profile & their approved portfolio artworks
 * @route   GET /api/artists/:id
 * @access  Public
 */
const getArtistById = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id).select('-passwordHash');

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    // Fetch artist's approved & featured artworks
    const artworks = await Artwork.find({
      artist: artist._id,
      status: { $in: ['approved', 'featured'] }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        artist,
        artworksCount: artworks.length,
        artworks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own artist profile
 * @route   PUT /api/artists/:id
 * @access  Protected (Owner only: req.user.id === :id)
 */
const updateArtist = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update your own profile'
      });
    }

    const { name, bio, profileImageUrl, portfolioTags } = req.body;

    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    if (name) artist.name = name.trim();
    if (bio !== undefined) artist.bio = bio.trim();
    if (profileImageUrl !== undefined) artist.profileImageUrl = profileImageUrl;
    if (portfolioTags !== undefined) {
      artist.portfolioTags = Array.isArray(portfolioTags)
        ? portfolioTags
        : portfolioTags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await artist.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: artist
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArtists,
  getArtistById,
  updateArtist
};
