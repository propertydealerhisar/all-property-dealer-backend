const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required:true },
    areaServed: { type: String, default: "" },
    tags: [{ type: String }],
    city: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    domain: { type: String, required: true },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Dealer", dealerSchema);
