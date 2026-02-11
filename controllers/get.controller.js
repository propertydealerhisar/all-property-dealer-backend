const Dealer = require("../models/Dealer");


exports.getAllData = async (req, res) => {
  try {
    let domain = req.params.domain;

    console.log("Incoming domain =>", domain);

    const withoutWWW = domain.replace("www.", "");
    const withWWW = "www." + withoutWWW;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const search = req.query.search || "";   // 👈 NEW

    let matchQuery = {
      $or: [
        { domain: withoutWWW },
        { domain: withWWW }
      ]
    };

    // 🔥 TEXT SEARCH LOGIC
    if (search) {
      matchQuery.$text = { $search: search };
    }

    const total = await Dealer.countDocuments(matchQuery);

    // 🔥 RANDOM + SEARCH COMBINE
    const list = await Dealer.aggregate([
      { $match: matchQuery },

      // Agar search ho to relevance sort
      ...(search
        ? [{ $sort: { score: { $meta: "textScore" } } }]
        : [{ $sample: { size: limit } }])
    ]);

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

//ya state ka dataa haryanaa ka la jaiyee
exports.getAllDataByState = async (req, res) => {
  try {
    let state = req.params.state.trim();

    console.log("Searching state =>", state);

    const matchQuery = {
      state: { $regex: new RegExp("^" + state + "$", "i") }
    };

    const total = await Dealer.countDocuments(matchQuery);

    if (total === 0) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found"
      });
    }

    // ======== IMPORTANT CHANGE HERE ========
    const list = await Dealer.aggregate([
      { $match: matchQuery },
      { $sample: { size: total } }   // randomize whole data
    ]);
    // =======================================

    res.json({
      success: true,
      totalRecords: total,
      data: list
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


exports.getAllDataByCity = async (req, res) => {
  try {
    let city = req.params.city.trim();

    console.log("Searching city =>", city);

    const matchQuery = {
      city: { $regex: new RegExp("^" + city + "$", "i") }
    };

    const total = await Dealer.countDocuments(matchQuery);

    if (total === 0) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found for this city"
      });
    }

    // 🔥 IMPORTANT CHANGE – NO LIMIT, ALL DATA RANDOM
    const list = await Dealer.aggregate([
      { $match: matchQuery },
      { $sample: { size: total } }   // jitna data utna sample
    ]);

    res.json({
      success: true,
      city: city,
      totalRecords: total,
      data: list
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
