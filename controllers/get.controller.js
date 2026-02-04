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


exports.getAllDataWithFallback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);

    const skip = (page - 1) * limit;

    // URL se aaya hua city name
    const targetCity = req.params.domain;

    // Case-insensitive regex query
    const cityQuery = new RegExp("^" + targetCity + "$", "i");

    // STEP 1 – City wise count (case insensitive)
    const cityTotal = await Dealer.countDocuments({
      city: cityQuery,
    });

    // STEP 2 – City wise data
    let list = await Dealer.find({
      city: cityQuery,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    let remaining = 0;

    // STEP 3 – Agar 20 se kam hua to fallback
    if (cityTotal < 20) {
      remaining = 20 - cityTotal;

      const extraData = await Dealer.find({
        city: { $not: cityQuery },
      })
        .sort({ createdAt: -1 })
        .limit(remaining);

      list = [...list, ...extraData];
    }

    res.json({
      success: true,

      targetCity: targetCity,

      originalCityCount: cityTotal,

      fallbackAdded: remaining > 0,
      fallbackCount: remaining,

      data: list,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
