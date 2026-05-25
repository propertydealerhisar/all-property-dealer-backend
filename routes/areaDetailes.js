const express = require("express");
const router = express.Router();

const {
  getLocationsByCity,
} = require("../controllers/areaDetailsController");

router.get("/locations/:city", getLocationsByCity);

module.exports = router;