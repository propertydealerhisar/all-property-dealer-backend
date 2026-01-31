const Dealer = require("../models/Dealer");
const fs = require("fs");
const path = require("path");

exports.importDealersFromJson = async (req, res) => {
  try {
    const { jsonPath } = req.body;

    if (!jsonPath) {
      return res.status(400).json({ message: "jsonPath is required" });
    }

    const fullPath = path.resolve(jsonPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "JSON file not found" });
    }

    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "JSON must be an array" });
    }

    // 🚀 DIRECT INSERT
    const result = await Dealer.insertMany(data);

    res.json({
      success: true,
      total: data.length,
      inserted: result.length,
      message: "Data saved to DB successfully",
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
