const Artist = require('../models/Artist');
const Artwork = require('../models/Artwork');

// GET /api/artists
exports.getArtists = async (req, res, next) => {
  try {
    const { tag, search, page = 1, limit = 20 } = req.query;
    const query = { role: 'artist' };
    if (tag) query.portfolioTags = { $in: [new RegExp(tag, 'i')] };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { bio: { $regex: search, $options: 'i' } }];

    const skip = (Number(page) - 1) * Number(limit);
    const [total, artists] = await Promise.all([
      Artist.countDocuments(query),
      Artist.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    ]);
    res.json({ success: true, total, data: artists });
  } catch (err) { next(err); }
};

// GET /api/artists/:id
exports.getArtistById = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id).select('-passwordHash');
    if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });
    const artworks = await Artwork.find({ artist: artist._id, status: { $in: ['approved', 'featured'] } }).sort({ createdAt: -1 });
    res.json({ success: true, data: { artist, artworks } });
  } catch (err) { next(err); }
};

// PUT /api/artists/:id  (owner only)
exports.updateArtist = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

    const { name, bio, profileImageUrl, portfolioTags } = req.body;
    if (name) artist.name = name.trim();
    if (bio !== undefined) artist.bio = bio;
    if (profileImageUrl !== undefined) artist.profileImageUrl = profileImageUrl;
    if (portfolioTags !== undefined)
      artist.portfolioTags = Array.isArray(portfolioTags) ? portfolioTags : portfolioTags.split(',').map(t => t.trim());

    await artist.save();
    res.json({ success: true, message: 'Profile updated', data: artist });
  } catch (err) { next(err); }
};
