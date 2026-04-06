const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    areaServed: { type: String, default: "" },
    tags: [{ type: String }],
    city: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    domain: { type: String },
    state: { type: String },
    area: { type: String }
  },
  { timestamps: true }
);

// 🔥 TEXT INDEX (MOST IMPORTANT)
dealerSchema.index({
  name: "text",
  address: "text",
  city: "text",
  area: "text",
  tags: "text"
});

module.exports = mongoose.model("Dealer", dealerSchema);