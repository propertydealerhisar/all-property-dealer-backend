const Dealer = require("../models/Dealer");

/**
 * ✅ GET all dealers by domain
 * URL: /api/dealers/:domain
 */
exports.getAllData = async (req, res) => {
  try {
    // pagination query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // total records
    const total = await Dealer.countDocuments({
      domain: req.domain,
    });

    // paginated list
    const list = await Dealer.find({
      domain: req.domain,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      domain: req.domain,

      // pagination info
      totalRecords: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      perPage: limit,

      data: list,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/**
 * ✅ GET single dealer by domain + slug
 * URL: /api/dealers/:domain/:slug
 */
exports.getSingleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const item = await Dealer.findOne({
      domain: req.domain,
      slug,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    res.json({
      success: true,
      domain: req.domain,
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
