// const express = require("express");
// const router = express.Router();

// const {getAllDataByState, getAllData, getAllDataWithFallback,getSingleBySlug,getAllDataByCity,getDealersByLocation,getPropertiesByArea} = require("../controllers/get.controller");
// const domainMiddleware = require("../middleware/domainMiddleware");

// // 🔥 domain middleware
// router.use("/:domain", domainMiddleware);

// // ===== OLD API – HOME PAGE KE LIYE (NO CHANGE) =====
// router.get("/getAllData/:domain", getAllData);

// // ===== NEW API – FOOTER CITY PAGES KE LIYE =====
// router.get("getAllDataWithFallback/:domain/fallback", getAllDataWithFallback);

// // ===== SINGLE DEALER (NO CHANGE) =====
// router.get("getSingleBySlug/:domain/:slug", getSingleBySlug);

// router.get("/state/:state",getAllDataByState);

// router.get("/city/:city", getAllDataByCity);

// router.get("/locationDealers", getDealersByLocation);

// router.get("/properties/:domain/:area", getPropertiesByArea);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
  getAllDataByState,
  getAllData,
  getAllDataWithFallback,
  getSingleBySlug,
  getAllDataByCity,
  getDealersByLocation,
  getPropertiesByArea,
  haryanaLocationFilter,
  searchDealers,getAllData2,getDealers ,getDealerBasicBySlug,getDealerSlugsByDomain,getAllDealerSlugs
} = require("../controllers/get.controller");

const domainMiddleware = require("../middleware/domainMiddleware");

// ===== HOME =====
router.get("/getAllData/:domain", domainMiddleware, getAllData);

// ===== FOOTER CITY =====
router.get("/getAllDataWithFallback/:domain/fallback", domainMiddleware, getAllDataWithFallback);

// ===== SINGLE DEALER =====
router.get("/getSingleBySlug/:domain/:slug", domainMiddleware, getSingleBySlug);

router.get("/state/:state", getAllDataByState);

router.get("/city/:city", getAllDataByCity);

router.get("/locationDealers", getDealersByLocation);

// 🔥 AREA PROPERTIES
router.get("/properties/:area", getPropertiesByArea);

router.get("/haryana-location-filter", haryanaLocationFilter);


router.get("/search", searchDealers);
router.get("/getAllData2/:domain",getAllData2);
router.get("/getDealers/:domain",getDealers )
router.get("/dealer-basic/:slug", getDealerBasicBySlug);
router.get("/slugs", getDealerSlugsByDomain);
router.get("/all-dealer-slugs", getAllDealerSlugs);
module.exports = router;
