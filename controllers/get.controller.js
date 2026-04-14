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

    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 100;
    const search = req.query.search ? req.query.search.trim() : "";
    const location = req.query.location ? req.query.location.trim() : "";

    if (page < 1) page = 1;
    if (limit < 1 || limit > 500) limit = 100;

    const skip = (page - 1) * limit;

    // =====================================================
    // 🔥 COMBINE SEARCH + LOCATION
    // =====================================================
    const finalSearch = `${search} ${location}`.trim();

    // =====================================================
    // BASE MATCH
    // =====================================================
    let matchQuery = {
      $and: [
        {
          $or: [
            { domain: withoutWWW },
            { domain: withWWW }
          ]
        }
      ]
    };

    // =====================================================
    // 🔥 TEXT SEARCH APPLY
    // =====================================================
    if (finalSearch) {
      matchQuery.$and.push({
        $text: {
          $search: finalSearch
        }
      });
    }

    // =====================================================
    // CHECK DOMAIN
    // =====================================================
    const domainExists = await Dealer.exists(matchQuery);

    if (!domainExists) {
      return res.status(404).json({
        success: false,
        message: "No data found for this domain",
      });
    }

    // =====================================================
    // COUNT
    // =====================================================
    const totalRecords = await Dealer.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalRecords / limit);

    // =====================================================
    // PIPELINE
    // =====================================================
    let pipeline = [
      { $match: matchQuery }
    ];

    // =====================================================
    // 🔥 SORT LOGIC
    // =====================================================
    if (finalSearch) {
      pipeline.push(
        {
          $addFields: {
            score: { $meta: "textScore" } // 🔥 main power
          }
        },
        {
          $sort: {
            score: -1,          // 🔥 best match top
            subscription: -1,   // 🔥 verified next
            createdAt: -1
          }
        },
        { $skip: skip },
        { $limit: limit }
      );
    } else {
      // no search → normal
      pipeline.push(
        {
          $sort: {
            subscription: -1,
            createdAt: -1
          }
        },
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

    // 2. DOMAIN GET (AUTO FIX 🔥)
    const domain = req.headers.domain || req.hostname;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is missing in request",
      });
    }

    // 3. FIND DEALER (ONLY REQUIRED FIELDS 🔥)
    const item = await Dealer.findOne(
      {
        domain: domain,
        slug: slug.trim(),
      },
      "name city state slug" // 👈 sirf ye fields
    );

    // 4. NOT FOUND
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    // 5. CLEAN RESPONSE 🔥
    return res.json({
      success: true,
      data: {
        name: item.name,
        city: item.city,
        state: item.state,
        slug: item.slug,
      },
    });

  } catch (err) {
    console.error("GET SINGLE DEALER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
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

    // console.log("Searching:", query);

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
    const { city, location, search } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const cityRegex = new RegExp(city.trim(), "i");

    let matchedDealers = [];

    // ✅ SEARCH WORKING (MAIN FIX)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");

      matchedDealers = await Dealer.find({
        city: cityRegex,
        $or: [
          { name: searchRegex },
          { address: searchRegex },
          { company: searchRegex },
        ],
      });
    }

    // ✅ LOCATION (fallback)
    else if (location && location.trim() !== "") {
      const locationRegex = new RegExp(location.trim(), "i");

      matchedDealers = await Dealer.find({
        city: cityRegex,
        address: locationRegex,
      });
    }

    // 🔹 Random dealers
    const matchedIds = matchedDealers.map((d) => d._id);

    const randomDealers = await Dealer.aggregate([
      {
        $match: {
          city: cityRegex,
          _id: { $nin: matchedIds },
        },
      },
      { $sample: { size: 30 } },
    ]);

    const finalDealers = [...matchedDealers, ...randomDealers].slice(0, 30);

    return res.status(200).json({
      success: true,
      count: finalDealers.length,
      matchedCount: matchedDealers.length,
      data: finalDealers,
    });

  } catch (error) {
    console.error("Haryana filter error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



// search ka liye api ha ya
// controllers/searchController.js



exports.searchDealers = async (req, res) => {
  try {
    let { q, domain, page = 1, limit = 50 } = req.query;

    q = q?.trim();
    domain = domain?.trim();
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query (q) is required",
      });
    }

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is required",
      });
    }

    const skip = (page - 1) * limit;

    // 🔥 Base filter (IMPORTANT)
    const baseFilter = {
      domain: domain   // 👈 yahi main logic hai
    };

    let dealers;
    let query;

    // 🔹 SHORT QUERY → REGEX
    if (q.length < 3) {
      query = {
        ...baseFilter,
        $or: [
          { name: { $regex: q, $options: "i" } },
          { address: { $regex: q, $options: "i" } },
          { area: { $regex: q, $options: "i" } },
          { tags: { $regex: q, $options: "i" } }
        ]
      };

      dealers = await Dealer.find(query)
        .skip(skip)
        .limit(limit);

    } else {
      // 🔥 TEXT SEARCH
      query = {
        ...baseFilter,
        $text: { $search: q }
      };

      dealers = await Dealer.find(
        query,
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit);
    }

    // 🔹 total count
    const total = await Dealer.countDocuments(query);

    res.status(200).json({
      success: true,
      domain,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: dealers,
    });

  } catch (error) {
    console.error("Search Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
// ************************************************************************

exports.getAllData2 = async (req, res) => {
  try {
    // 🔥 PARAMS (domain required)
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is required",
      });
    }

    // 🔥 QUERY PARAMS
    let { page = 1, limit = 50, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 BASE FILTER (DOMAIN FIRST)
    let baseFilter = { domain };

    let data = [];
    let totalDocs = 0;

    // =====================================================
    // 🔍 CASE 1: SEARCH AVAILABLE → TEXT INDEX SEARCH
    // =====================================================
    if (search && search.trim() !== "") {
      const searchFilter = {
        ...baseFilter,
        $text: { $search: search }
      };

      totalDocs = await Dealer.countDocuments(searchFilter);

      data = await Dealer.find(searchFilter, {
        score: { $meta: "textScore" },
      })
        .sort({ score: { $meta: "textScore" } }) // best match first
        .skip(skip)
        .limit(limit);
    } 
    
    // =====================================================
    // 🎲 CASE 2: NO SEARCH → RANDOM DATA
    // =====================================================
    else {
      // count total docs for pagination
      totalDocs = await Dealer.countDocuments(baseFilter);

      data = await Dealer.aggregate([
        { $match: baseFilter },
        { $sample: { size: limit } }, // random docs
      ]);
    }

    // 🔥 PAGINATION DETAILS
    const totalPages = Math.ceil(totalDocs / limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages,
      totalDocs,
      count: data.length,
      data,
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// ************************************************************************
exports.getDealers = async (req, res) => {
  try {
    const { domain } = req.params;
    let { search, page = 1, limit = 10 } = req.query;
    console.log("Getting dealers for domain:", search===" ");

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔹 COMMON TOTAL (for random cases)
    const totalDomainDocs = await Dealer.countDocuments({ domain });

    // =========================================================
    // 🔹 CASE 1: NO SEARCH → RANDOM WITH PAGINATION
    // =========================================================
    if (!search || search.trim() === "") {
      console.log("No search query, returning random data...");
      const data = await Dealer.find({ domain })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalDocs: totalDomainDocs,
          totalPages: Math.ceil(totalDomainDocs / limit)
        },
        data
      });
    }

    // =========================================================
    // 🔹 SEARCH EXISTS
    // =========================================================

    // 👉 total search count
    const searchCount = await Dealer.countDocuments({
      domain,
      $text: { $search: search }
    });

    // =========================================================
    // 🔹 CASE 2: searchCount >= 100 → PURE SEARCH PAGINATION
    // =========================================================
    if (searchCount >= 100) {
      const data = await Dealer.find(
        {
          domain,
          $text: { $search: search }
        },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalDocs: searchCount,
          totalPages: Math.ceil(searchCount / limit)
        },
        data
      });
    }

    // =========================================================
    // 🔹 CASE 3: searchCount < 100
    // =========================================================

    // 👉 PAGE 1 → SEARCH + RANDOM FILL (till 100)
    if (page === 1) {
      const searchResults = await Dealer.find(
        {
          domain,
          $text: { $search: search }
        },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });

      const remaining = 100 - searchResults.length;

      let randomData = [];

      if (remaining > 0) {
        randomData = await Dealer.aggregate([
          {
            $match: {
              domain,
              _id: { $nin: searchResults.map(d => d._id) }
            }
          },
          { $sample: { size: remaining } }
        ]);
      }

      const combined = [...searchResults, ...randomData];

      const paginatedData = combined.slice(0, limit);

      return res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalDocs: combined.length, // max 100
          totalPages: Math.ceil(combined.length / limit)
        },
        data: paginatedData
      });
    }

    // =========================================================
    // 👉 PAGE > 1 → RANDOM ONLY
    // =========================================================
    const data = await Dealer.aggregate([
      { $match: { domain } },
      { $sample: { size: limit } }
    ]);

    return res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalDocs: totalDomainDocs,
        totalPages: Math.ceil(totalDomainDocs / limit)
      },
      data
    });

  } catch (error) {
    console.error("Error in getDealers:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



//==================================================================================
// controllers/dealer.controller.js

exports.getDealerBasicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. VALIDATION
    if (!slug || slug.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    // 2. DOMAIN (AUTO HANDLE 🔥)
    const domain = req.headers.domain || req.hostname;

    // 3. FIND ONLY REQUIRED DATA
    const dealer = await Dealer.findOne(
      {
        slug: slug.trim(),
        domain: domain,
      },
      "name city state slug" // 👈 only required fields
    );

    // 4. NOT FOUND
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    // 5. SUCCESS RESPONSE
    return res.status(200).json({
      success: true,
      data: {
        name: dealer.name,
        city: dealer.city,
        state: dealer.state,
        slug: dealer.slug,
      },
    });

  } catch (error) {
    console.error("GET DEALER BASIC ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};




//=============================================================================================
exports.getDealerSlugsByDomain = async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: "Domain is required",
      });
    }

    // 🔥 FULL CLEAN (important)
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim();

    // 🔥 MATCH BOTH (www + non-www)
    const dealer = await Dealer.find({
      domain: {
        $in: [
          cleanDomain,
          `www.${cleanDomain.replace(/^www\./, "")}`,
          cleanDomain.replace(/^www\./, "")
        ]
      }
    }).select("slug -_id");

    return res.status(200).json({
      success: true,
      count: dealer.length,
      data: dealer,
    });

  } catch (error) {
    console.error("Dealer Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


//=====================================================
exports.getAllDealerSlugs = async (req, res) => {

  try {

    const { city } = req.query;

    // 🔥 sirf haryana allow
    if (!city || city.toLowerCase() !== "haryana") {
      return res.status(400).json({
        success: false,
        message: "Only city=haryana is allowed",
      });
    }

    // 🔥 DB match (Haryana case-insensitive)
    const dealers = await Dealer.find({
      state: { $regex: /^haryana$/i } // ✅ BEST MATCH
    })
      .select("slug -_id") // only slug
      .lean();

    return res.status(200).json({
      success: true,
      count: dealers.length,
      data: dealers,
    });

  } catch (error) {
    console.error("Haryana Dealer Slugs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};