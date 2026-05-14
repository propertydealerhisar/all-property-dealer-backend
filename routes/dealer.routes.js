const express = require("express");
const router = express.Router();
const { importDealersFromJson, updateAreaByDomainAndSlug,getDealerBySlug } = require("../controllers/dealer.controller");

router.post("/import-json", importDealersFromJson);

router.post("/update-area", updateAreaByDomainAndSlug);
router.get("/:slug", getDealerBySlug);


module.exports = router;
