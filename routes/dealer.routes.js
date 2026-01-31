const express = require("express");
const router = express.Router();
const { importDealersFromJson } = require("../controllers/dealer.controller");

router.post("/import-json", importDealersFromJson);

module.exports = router;
