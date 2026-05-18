// routes/dealerMetaRoutes.js

const express =
  require("express");

const router =
  express.Router();

const {
  addDealerMeta,
  getDealerMeta,
} = require("../controllers/dealerMetaController"
);

// ✅ ADD DEALER META ROUTE

router.post(
  "/add-dealer-meta",
  addDealerMeta
);
router.get(
  "/get-dealer-meta/:slug",
  getDealerMeta
);

module.exports = router;