const express = require("express");
const router = express.Router();

const {
  getLocationsByCity,getAllLocationsForSitemap
} = require("../controllers/areaDetailsController");

router.get("/locations/:city", getLocationsByCity);
router.get("/sitemap-locations", getAllLocationsForSitemap);

module.exports = router;