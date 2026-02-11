const express = require("express");
const router = express.Router();
const { importDealersFromJson, updateAreaByDomainAndSlug } = require("../controllers/dealer.controller");

router.post("/import-json", importDealersFromJson);

router.post("/update-area", updateAreaByDomainAndSlug);


module.exports = router;
