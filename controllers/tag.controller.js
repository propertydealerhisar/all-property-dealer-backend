const Dealer = require("../models/Dealer");

// 🏷️ TAG POOL (Tumhare final tags)
const TAG_POOL = [
  "Real Estate Agents",
  "Estate Agents for Residential Rental",
  "Estate Agents for Commercial Rental",
  "Estate Agents for Residence",
  "House Rentals for Family",
  "Real Estate Agents for House Sell/Purchase",
  "Real Estate agents for Flat Sell/Purchase",
  "Estate Agent for Leasehold",
  "Apartment Rental",
  "Estate Agents for Residential Space",
  "Estate Agents for Commercial Space",
  "Real Estate agents for Plot Sell/Purchase",
  "Trusted Property Dealer",
  "Real Estate Broker for Residence",
  "Real Estate Agents for To-Let Service",
];

// 🔁 AUTO SET TAGS TO ALL RECORDS WHICH DON'T HAVE TAGS
exports.autoSetTags = async (req, res) => {
  try {
    // Find records where tags not exist or empty
    const list = await Dealer.find({
      $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }],
    });

    let updated = 0;
    let tagIndex = 0;

    for (const item of list) {
      const tag1 = TAG_POOL[tagIndex % TAG_POOL.length];
      const tag2 = TAG_POOL[(tagIndex + 1) % TAG_POOL.length];
      const tags = [tag1, tag2];

      tagIndex += 2;

      item.tags = tags;
      await item.save();
      updated++;
    }

    res.json({
      success: true,
      totalFound: list.length,
      updated,
      message: "Tags auto assigned successfully",
    });
  } catch (err) {
    console.error("AUTO TAG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
