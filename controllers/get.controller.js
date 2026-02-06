const Dealer = require("../models/Dealer");

/**
 * ✅ GET all dealers by domain
 * URL: /api/dealers/:domain
 */
exports.getAllData = async (req, res) => {
  try {
    let domain = req.params.domain;

    console.log("Incoming domain =>", domain);

    const withoutWWW = domain.replace("www.", "");
    const withWWW = "www." + withoutWWW;

    console.log("Searching for =>", withoutWWW, "OR", withWWW);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    const total = await Dealer.countDocuments({
      $or: [
        { domain: withoutWWW },
        { domain: withWWW }
      ]
    });

    const list = await Dealer.find({
      $or: [
        { domain: withoutWWW },
        { domain: withWWW }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      domain: withoutWWW,
      totalRecords: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
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
