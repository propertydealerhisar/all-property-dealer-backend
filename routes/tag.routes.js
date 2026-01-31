const express = require("express");
const router = express.Router();
const { autoSetTags } = require("../controllers/tag.controller");

// 🔵 One-time API to auto set tags
router.post("/auto-set", autoSetTags);

module.exports = router;
