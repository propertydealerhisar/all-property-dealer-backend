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
    let { page = 1, limit = 100, city } = req.query;

    // ================= VALIDATION =================
    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State parameter is required"
      });
    }

    state = state.trim();
    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) page = 1;
    if (limit > 200) limit = 100; // safety cap

    // ================= DEFAULT CITY =================
    if (!city || city.trim() === "") {
      city = "Faridabad"; // ✅ Default City
    }

    // ================= BUILD QUERY =================
    const query = {
      state: { 
        $regex: new RegExp("^" + state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") 
      },
      city: { 
        $regex: new RegExp("^" + city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") 
      }
    };

    console.log("Searching:", query);

    // ================= COUNT =================
    const total = await Dealer.countDocuments(query);

    if (total === 0) {
      return res.status(404).json({
        success: false,
        message: "No dealers found",
        state,
        city
      });
    }

    // ================= PAGINATION =================
    const skip = (page - 1) * limit;

    const dealers = await Dealer.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // newest first

    return res.json({
      success: true,
      state,
      city,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      returnedRecords: dealers.length,
      data: dealers
    });

  } catch (err) {
    console.error("GET DATA BY STATE ERROR:", err);

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
    const { domain, location } = req.query;
    if (!domain || !location) {
      return res.status(400).json({
        success: false,
        message: "Domain and location required"
      });
    }

    const cleanDomain = domain.replace(/^www\./, "").trim();
    const cleanLocation = location.replace(/-/g, " ").trim();

    const baseFilter = {
      domain: { $regex: cleanDomain, $options: "i" }
    };

    // 🔹 Step 1: Exact Match Dealers
    const matchedDealers = await Dealer.find({
      ...baseFilter,
      address: cleanLocation
    }).lean();

    let finalDealers = [];

    if (matchedDealers.length > 0) {

      // 🔝 Match wale top par
      finalDealers = [...matchedDealers];

      const remainingCount = 30 - matchedDealers.length;

      if (remainingCount > 0) {
        // ❗ Matched ko exclude karke random uthao
        const matchedIds = matchedDealers.map(d => d._id);

        const randomDealers = await Dealer.aggregate([
          { $match: { ...baseFilter, _id: { $nin: matchedIds } } },
          { $sample: { size: remainingCount } }
        ]);

        finalDealers = [...finalDealers, ...randomDealers];
      }

    } else {

      // ❌ Agar ek bhi match nahi mila
      finalDealers = await Dealer.aggregate([
        { $match: baseFilter },
        { $sample: { size: 30 } }
      ]);

    }

    // 🔥 Ensure maximum 30
    finalDealers = finalDealers.slice(0, 30);

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      count: finalDealers.length,
      data: finalDealers
    });

  } catch (err) {
    console.error("Location API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
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



exports.haryanaLocationFilter = async (req, res) => {
  try {
    const { city, location } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const cityRegex = new RegExp(city.trim(), "i");

    let matchedDealers = [];

    // 🔹 Step 1: Location matched dealers
    if (location && location.trim() !== "") {
      const locationRegex = new RegExp(location.trim(), "i");

      matchedDealers = await Dealer.find({
        city: cityRegex,
        address: locationRegex,
      });
    }

    // 🔹 Step 2: Random dealers (excluding matched ones)
    const matchedIds = matchedDealers.map(d => d._id);

    const randomDealers = await Dealer.aggregate([
      {
        $match: {
          city: cityRegex,
          _id: { $nin: matchedIds }
        }
      },
      { $sample: { size: 30 } }
    ]);

    // 🔹 Step 3: Combine → matched first, then random
    const finalDealers = [...matchedDealers, ...randomDealers].slice(0, 30);

    return res.status(200).json({
      success: true,
      count: finalDealers.length,
      matchedCount: matchedDealers.length,
      data: finalDealers,
    });

  } catch (error) {
    console.error("Haryana location filter error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
