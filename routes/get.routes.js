const express = require("express");
const router = express.Router();

const dealerController = require("../controllers/get.controller");
const domainMiddleware = require("../middleware/domainMiddleware");

// 🔥 domain middleware
router.use("/:domain", domainMiddleware);

// ===== OLD API – HOME PAGE KE LIYE (NO CHANGE) =====
router.get("/:domain", dealerController.getAllData);

// ===== NEW API – FOOTER CITY PAGES KE LIYE =====
router.get("/:domain/fallback", dealerController.getAllDataWithFallback);

// ===== SINGLE DEALER (NO CHANGE) =====
router.get("/:domain/:slug", dealerController.getSingleBySlug);

module.exports = router;
