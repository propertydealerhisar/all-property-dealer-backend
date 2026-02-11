const express = require("express");
const router = express.Router();

const {getAllDataByState, getAllData, getAllDataWithFallback,getSingleBySlug,getAllDataByCity} = require("../controllers/get.controller");
const domainMiddleware = require("../middleware/domainMiddleware");

// 🔥 domain middleware
router.use("/:domain", domainMiddleware);

// ===== OLD API – HOME PAGE KE LIYE (NO CHANGE) =====
router.get("/getAllData/:domain", getAllData);

// ===== NEW API – FOOTER CITY PAGES KE LIYE =====
router.get("getAllDataWithFallback/:domain/fallback", getAllDataWithFallback);

// ===== SINGLE DEALER (NO CHANGE) =====
router.get("getSingleBySlug/:domain/:slug", getSingleBySlug);

router.get("/state/:state",getAllDataByState);

router.get("/city/:city", getAllDataByCity);

module.exports = router;
