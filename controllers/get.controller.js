const Dealer = require("../models/Dealer");


exports.getAllData = async (req, res) => {
  try {
    let domain = req.params.domain;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain parameter is required"
      });
    }

    const withoutWWW = domain.replace("www.", "");
    const withWWW = "www." + withoutWWW;

    // Pagination params
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? req.query.search.trim() : "";

    if (page < 1) page = 1;
    if (limit < 1 || limit > 500) limit = 10;

    const skip = (page - 1) * limit;

    // Base match query
    let matchQuery = {
      $or: [
        { domain: withoutWWW },
        { domain: withWWW }
      ]
    };

    // Add search condition
    if (search.length > 0) {
      matchQuery.$text = { $search: search };
    }

    // Check domain exists
    const domainExists = await Dealer.exists({
      $or: [
        { domain: withoutWWW },
        { domain: withWWW }
      ]
    });

    if (!domainExists) {
      return res.status(404).json({
        success: false,
        message: "No data found for this domain",
      });
    }

    // Total records count
    const totalRecords = await Dealer.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalRecords / limit);

    // Aggregation pipeline
    let pipeline = [
      { $match: matchQuery }
    ];

    if (search.length > 0) {
      // SEARCH MODE → sort by textScore
      pipeline.push(
        { $addFields: { score: { $meta: "textScore" } } },
        { $sort: { score: -1 } },
        { $skip: skip },
        { $limit: limit }
      );
    } else {
      // RANDOM SHUFFLE MODE
      pipeline.push(
        { $sample: { size: totalRecords } }, // shuffle all matched records
        { $skip: skip },
        { $limit: limit }
      );
    }

    const dealers = await Dealer.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      domain: withoutWWW,
      currentPage: page,
      totalPages,
      totalRecords,
      dataCount: dealers.length,
      data: dealers
    });

  } catch (err) {
    console.error("GET ALL DATA ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
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

    // 1. SLUG VALIDATION
    if (!slug || slug.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Slug parameter is required",
      });
    }

    // 2. DOMAIN VALIDATION
    if (!req.domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is missing in request",
      });
    }

    // 3. FIND DEALER
    const item = await Dealer.findOne({
      domain: req.domain,
      slug: slug.trim(),
    });

    // 4. NOT FOUND HANDLING
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
        slug: slug,
        domain: req.domain,
      });
    }

    // 5. SUCCESS RESPONSE
    return res.json({
      success: true,
      domain: req.domain,
      data: item,
    });

  } catch (err) {
    console.error("GET SINGLE DEALER ERROR:", err);

    // 6. INVALID OBJECT ID / QUERY ERROR
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid slug format",
        error: err.message,
      });
    }

    // 7. MONGODB CONNECTION ERROR
    if (err.name === "MongoError") {
      return res.status(503).json({
        success: false,
        message: "Database error occurred",
        error: err.message,
      });
    }

    // 8. DEFAULT SERVER ERROR
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
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
    let state = req.params.state;

    // 1. STATE VALIDATION
    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State parameter is required"
      });
    }

    state = state.trim();

    console.log("Searching state =>", state);

    // 2. SAFE REGEX MATCH
    const matchQuery = {
      state: { $regex: new RegExp("^" + state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") }
    };

    // 3. CHECK DATA EXISTS
    const total = await Dealer.countDocuments(matchQuery);

    if (total === 0) {
      return res.status(404).json({
        success: false,
        message: "No dealers found for this state",
        state: state
      });
    }

    // 4. LIMIT CONTROL (for safety)
    const MAX_LIMIT = 2000;
    const sampleSize = total > MAX_LIMIT ? MAX_LIMIT : total;

    // 5. AGGREGATION WITH ERROR SAFE PIPELINE
    const list = await Dealer.aggregate([
      { $match: matchQuery },
      { $sample: { size: sampleSize } }
    ]);

    // 6. FINAL SUCCESS RESPONSE
    return res.json({
      success: true,
      state: state,
      totalRecords: total,
      returnedRecords: list.length,
      data: list
    });

  } catch (err) {
    console.error("GET DATA BY STATE ERROR:", err);

    // 7. HANDLE MONGODB ERRORS
    if (err.name === "MongoError") {
      return res.status(503).json({
        success: false,
        message: "Database error occurred",
        error: err.message
      });
    }

    // 8. REGEX OR QUERY ERROR
    if (err.name === "SyntaxError") {
      return res.status(400).json({
        success: false,
        message: "Invalid state format",
        error: err.message
      });
    }

    // 9. DEFAULT SERVER ERROR
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
};



exports.getAllDataByCity = async (req, res) => {
  try {
    let city = req.params.city;

    // 1. CITY VALIDATION
    if (!city || city.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "City parameter is required"
      });
    }

    city = city.trim();

    console.log("Searching city =>", city);

    // 2. SAFE REGEX (injection safe)
    const safeCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchQuery = {
      city: { $regex: new RegExp("^" + safeCity + "$", "i") }
    };

    // 3. COUNT RECORDS
    const total = await Dealer.countDocuments(matchQuery);

    if (total === 0) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found for this city",
        city: city
      });
    }

    // 4. SAME ORIGINAL LOGIC (NO CHANGE)
    const list = await Dealer.aggregate([
      { $match: matchQuery },
      { $sample: { size: total } }
    ]);

    // 5. SUCCESS RESPONSE
    return res.json({
      success: true,
      city: city,
      totalRecords: total,
      data: list
    });

  } catch (err) {
    console.error("GET DATA BY CITY ERROR:", err);

    // 6. MONGODB SPECIFIC ERROR
    if (err.name === "MongoError") {
      return res.status(503).json({
        success: false,
        message: "Database error occurred",
        error: err.message
      });
    }

    // 7. INVALID QUERY / REGEX ERROR
    if (err.name === "SyntaxError") {
      return res.status(400).json({
        success: false,
        message: "Invalid city format",
        error: err.message
      });
    }

    // 8. DEFAULT SERVER ERROR
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
};


exports.getDealersByLocation = async (req, res) => {
  try {
    const domain = req.query.domain;
    const location = req.query.location;

    const withoutWWW = domain.replace("www.", "");
    const withWWW = "www." + withoutWWW;

    const baseFilter = {
      domain: { $in: [withoutWWW, withWWW] }
    };

    const sector = location.split(",")[0].trim();

    // 1. Exact location match
    let matched = await Dealer.find({
      ...baseFilter,
      address: { $regex: sector, $options: "i" }
    });

    // 2. Other dealers from same city
    let others = await Dealer.find({
      ...baseFilter,
      city: { $regex: location.split(",")[1]?.trim() || "", $options: "i" }
    });

    // Remove duplicates
    others = others.filter(o =>
      !matched.some(m => m._id.toString() === o._id.toString())
    );

    let finalList = [...matched, ...others];

    // 3. Guarantee 30 cards
    if (finalList.length < 30) {
      const extra = await Dealer.find(baseFilter)
        .limit(30 - finalList.length);

      extra.forEach(e => {
        if (!finalList.some(f => f._id.toString() === e._id.toString())) {
          finalList.push(e);
        }
      });
    }

    res.json({
      success: true,
      data: finalList.slice(0, 30)
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.getPropertiesByArea = async (req, res) => {
  try {
    const areaSlug = req.params.area;

    if (!areaSlug) {
      return res.status(400).json({
        success: false,
        message: "Area parameter required"
      });
    }

    const formattedArea = areaSlug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    console.log("Searching for area:", formattedArea);

    const DOMAIN = "www.propertydealerindelhi.com";
    const LIMIT = 100;

    // 🔹 Step 1: Get Area Dealers
    let areaDealers = await Dealer.find({
  domain: DOMAIN,
  area: { $regex: new RegExp("^" + formattedArea + "$", "i") }
}).limit(LIMIT);


    // 🔹 If already enough dealers
    if (areaDealers.length >= LIMIT) {
      return res.status(200).json({
        success: true,
        total: areaDealers.length,
        data: areaDealers
      });
    }

    // 🔹 Step 2: If less than 100 → Get same city random dealers
    let cityDealers = [];
    const remaining = LIMIT - areaDealers.length;

    if (areaDealers.length > 0) {
      const cityName = areaDealers[0].city;

      cityDealers = await Dealer.aggregate([
        {
          $match: {
            domain: DOMAIN,
            city: cityName,
            area: { $ne: formattedArea }
          }
        },
        { $sample: { size: remaining } }
      ]);
    }

    // 🔹 Merge area + city fallback
    const finalDealers = [...areaDealers, ...cityDealers];

    return res.status(200).json({
      success: true,
      total: finalDealers.length,
      data: finalDealers
    });

  } catch (error) {
    console.error("Area filter error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
