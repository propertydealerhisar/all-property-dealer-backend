const express = require("express");
const router = express.Router();

const dealerController = require("../controllers/get.controller");
const domainMiddleware = require("../middleware/domainMiddleware");

// 🔥 domain middleware
router.use("/:domain", domainMiddleware);

// all dealers
router.get("/:domain", dealerController.getAllData);

// single dealer
router.get("/:domain/:slug", dealerController.getSingleBySlug);

module.exports = router;
