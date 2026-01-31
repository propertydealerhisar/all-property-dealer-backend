const fs = require("fs");
const path = require("path");

/* ============================
   🏷️ TAG POOL
============================ */
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

// helper
function makeSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function importDealersOnce() {
  try {
    const inputPath = path.join(__dirname, "../data/all.json");
    const outputCleaned = path.join(__dirname, "../data/dealers_cleaned.json");
    const outputSkipped = path.join(__dirname, "../data/dealers_skipped.json");

    if (!fs.existsSync(inputPath)) {
      console.log("⚠️ Input JSON not found");
      return;
    }

    const raw = fs.readFileSync(inputPath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.log("❌ Input JSON is not an array");
      return;
    }

    const seenSlugs = new Set();
    const seenNameAddress = new Set();

    const cleaned = [];
    const skipped = [];
    let tagIndex = 0;

    for (const item of data) {
      /* ============================
         ❌ VALIDATION CHECKS
      ============================ */

      if (!item.name || !item.address) {
        skipped.push({
          deleteReason: "Missing name or address",
          item,
        });
        continue;
      }

      const city = "Hansi";
      const slug = makeSlug(`${item.name} ${city}`);

      // Duplicate by slug
      if (seenSlugs.has(slug)) {
        skipped.push({
          deleteReason: "Duplicate data (same name + city → slug already exists)",
          slug,
          item,
        });
        continue;
      }

      // Duplicate by name + address (extra safety)
      const nameAddressKey = makeSlug(
        `${item.name} ${item.address}`
      );

      if (seenNameAddress.has(nameAddressKey)) {
        skipped.push({
          deleteReason: "Duplicate data (same name + same address)",
          item,
        });
        continue;
      }

      seenSlugs.add(slug);
      seenNameAddress.add(nameAddressKey);

      /* ============================
         🏷️ AUTO TAG ASSIGN
      ============================ */
      const tag1 = TAG_POOL[tagIndex % TAG_POOL.length];
      const tag2 = TAG_POOL[(tagIndex + 1) % TAG_POOL.length];
      tagIndex += 2;

      cleaned.push({
        name: item.name,
        address: item.address,
        areaServed: item.areaServed || "",
        city,
        slug,
        tags: [tag1, tag2],
      });
    }

    fs.writeFileSync(outputCleaned, JSON.stringify(cleaned, null, 2));
    fs.writeFileSync(outputSkipped, JSON.stringify(skipped, null, 2));

    /* ============================
       📊 SUMMARY LOG
    ============================ */
    console.log("================================");
    console.log("✅ JSON processing completed");
    console.log("📦 Total input records:", data.length);
    console.log("🧹 Cleaned & kept:", cleaned.length);
    console.log("🗑️ Deleted / skipped:", skipped.length);
    console.log("📁 dealers_cleaned.json created");
    console.log("📁 dealers_skipped.json created");
    console.log("================================");
  } catch (err) {
    console.error("❌ JSON processing error:", err.message);
  }
}

/* 🔥 AUTO RUN */
if (require.main === module) {
  importDealersOnce();
}

module.exports = importDealersOnce;
