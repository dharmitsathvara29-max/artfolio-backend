const Sale = require('../models/Sale');
const Artwork = require('../models/Artwork');
const Notification = require('../models/Notification');
const { emitNotification } = require('../sockets/notificationSocket');

/**
 * @desc    Record a print/original sale (simulated e-commerce)
 * @route   POST /api/sales
 * @access  Protected (Role: artist or admin)
 */
const recordSale = async (req, res, next) => {
  try {
    const { artworkId, buyerName, buyerEmail, amount, saleType } = req.body;

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // If role is artist, ensure they own the artwork
    if (req.user.role === 'artist' && artwork.artist.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only record sales for your own artworks'
      });
    }

    const saleAmount = amount !== undefined ? Number(amount) : (artwork.price || 0);

    const sale = await Sale.create({
      artwork: artwork._id,
      artist: artwork.artist,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.toLowerCase().trim(),
      amount: saleAmount,
      saleType: saleType || 'print'
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate('artwork', 'title imageUrl price')
      .populate('artist', 'name email');

    // Notify artist
    const notification = await Notification.create({
      recipient: artwork.artist,
      type: 'sale_recorded',
      message: `Congratulations! A ${saleType || 'print'} of "${artwork.title}" was sold to ${buyerName} for ₹${saleAmount.toLocaleString('en-IN')}`,
      relatedId: sale._id
    });

    // Emit real-time notification
    const io = req.app.locals.io;
    emitNotification(io, artwork.artist, notification);

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: populatedSale
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all sales (admin/debug)
 * @route   GET /api/sales
 * @access  Protected (Admin only)
 */
const getAllSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Sale.countDocuments();
    const sales = await Sale.find()
      .populate('artwork', 'title imageUrl price')
      .populate('artist', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sales & earnings dashboard for a specific artist
 * @route   GET /api/sales/artist/:id
 * @access  Protected (Artist or Admin)
 */
const getArtistSales = async (req, res, next) => {
  try {
    const artistId = req.params.id;

    // Verify permissions: only artist themselves or admin
    if (req.user.id !== artistId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own sales data'
      });
    }

    const sales = await Sale.find({ artist: artistId })
      .populate('artwork', 'title imageUrl price category')
      .sort({ createdAt: -1 });

    // Calculate aggregated metrics
    const totalEarnings = sales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
    const totalSalesCount = sales.length;

    // This month earnings calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthSales = sales.filter((s) => new Date(s.createdAt) >= startOfMonth);
    const thisMonthEarnings = thisMonthSales.reduce((acc, s) => acc + (s.amount || 0), 0);

    res.status(200).json({
      success: true,
      analytics: {
        totalEarnings,
        thisMonthEarnings,
        totalSalesCount,
        thisMonthSalesCount: thisMonthSales.length,
        currency: 'INR'
      },
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordSale,
  getAllSales,
  getArtistSales
};
