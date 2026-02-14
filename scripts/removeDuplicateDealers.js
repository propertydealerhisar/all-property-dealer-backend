const fs = require("fs");

// ===== CONFIG =====
const FILE_PATH = "./Central-delhi/emerged.json";
// ==================

try {
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.log("❌ JSON file array format me nahi hai");
    process.exit(1);
  }

  console.log(`Total Records Before: ${data.length}`);

  const uniqueMap = new Map();
  const slugSet = new Set();

  let duplicateCount = 0;
  let emptyAddressCount = 0;
  let slugDuplicateCount = 0;

  data.forEach(item => {
    const name = (item.name || "").toLowerCase().trim();
    const address = (item.address || "").toLowerCase().trim();
    const slug = (item.slug || "").toLowerCase().trim();

    // 🔴 REMOVE EMPTY ADDRESS RECORDS
    if (!address) {
      emptyAddressCount++;
      return;
    }

    // 🔴 REMOVE SLUG DUPLICATES
    if (slugSet.has(slug)) {
      slugDuplicateCount++;
      return;
    }

    // mark slug as used
    slugSet.add(slug);

    // name + address ko unique key banaya
    const key = `${name}___${address}`;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    } else {
      duplicateCount++;
    }
  });

  const uniqueData = Array.from(uniqueMap.values());

  console.log(`Total Records After: ${uniqueData.length}`);
  console.log(`Removed Name+Address Duplicates: ${duplicateCount}`);
  console.log(`Removed Empty Address Records: ${emptyAddressCount}`);
  console.log(`Removed Slug Duplicates: ${slugDuplicateCount}`);

  fs.writeFileSync(
    FILE_PATH,
    JSON.stringify(uniqueData, null, 2),
    "utf-8"
  );

  console.log("✅ CLEANUP DONE → Empty Address + Duplicates + Slug Duplicates Removed!");

} catch (err) {
  console.log("❌ Error:", err.message);
}
