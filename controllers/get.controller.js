const Dealer = require("../models/Dealer");

/**
 * ✅ GET all dealers by domain
 * URL: /api/dealers/:domain
 */
exports.getAllData = async (req, res) => {
  try {
    const list = await Dealer.find({
      domain: req.domain,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      domain: req.domain,
      total: list.length,
      data: list,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ✅ GET single dealer by domain + slug
 * URL: /api/dealers/:domain/:slug
 */
exports.getSingleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const item = await Dealer.findOne({
      domain: req.domain,
      slug,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found",
      });
    }

    res.json({
      success: true,
      domain: req.domain,
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
