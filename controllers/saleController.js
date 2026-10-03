const Sale = require('../models/Sale');
const Artwork = require('../models/Artwork');
const { sendNotification } = require('../sockets/notificationSocket');

// POST /api/sales
exports.recordSale = async (req, res, next) => {
  try {
    const { artworkId, buyerName, buyerEmail, amount, saleType } = req.body;
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
    if (req.user.role === 'artist' && artwork.artist.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const sale = await Sale.create({
      artwork: artwork._id, artist: artwork.artist,
      buyerName, buyerEmail: buyerEmail.toLowerCase(),
      amount: Number(amount), saleType: saleType || 'print'
    });

    await sendNotification(req.app.locals.io, {
      recipient: artwork.artist, type: 'sale_recorded',
      message: `A ${saleType || 'print'} of "${artwork.title}" sold to ${buyerName} for ₹${Number(amount).toLocaleString('en-IN')}`,
      relatedId: sale._id
    });

    res.status(201).json({ success: true, data: sale });
  } catch (err) { next(err); }
};

// GET /api/sales
exports.getAllSales = async (req, res, next) => {
  try {
    const sales = await Sale.find().populate('artwork', 'title price').populate('artist', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) { next(err); }
};

// GET /api/sales/artist/:id
exports.getArtistSales = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const sales = await Sale.find({ artist: req.params.id }).populate('artwork', 'title imageUrl category').sort({ createdAt: -1 });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = sales.filter(s => new Date(s.createdAt) >= startOfMonth);

    res.json({
      success: true,
      analytics: {
        totalEarnings: sales.reduce((s, x) => s + x.amount, 0),
        thisMonthEarnings: thisMonth.reduce((s, x) => s + x.amount, 0),
        totalSales: sales.length, thisMonthSales: thisMonth.length, currency: 'INR'
      },
      data: sales
    });
  } catch (err) { next(err); }
};
