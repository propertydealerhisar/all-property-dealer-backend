const fs = require("fs");
const path = require("path");

// 👉 INPUT FILE
const INPUT_FILE = "./data/chand.json";

// 👉 OUTPUT FOLDER
const OUTPUT_FOLDER = "./output";

const UNIQUE_FILE = path.join(OUTPUT_FOLDER, "unique.json");
const DUPLICATE_FILE = path.join(OUTPUT_FOLDER, "duplicates.json");

// 👉 slug generator
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// 👉 create folder
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
}

// 👉 read data
const rawData = fs.readFileSync(INPUT_FILE, "utf-8");
let data = JSON.parse(rawData);

if (!Array.isArray(data)) {
  data = [data];
}

// 👉 process
const slugMap = new Map();
const unique = [];
const duplicates = [];

data.forEach((item) => {
  const slug = item.slug || generateSlug(item.name || "");

  if (slugMap.has(slug)) {
    duplicates.push({
      ...item,
      slug,
    });
  } else {
    slugMap.set(slug, true);
    unique.push({
      ...item,
      slug,
    });
  }
});

// 👉 save files
fs.writeFileSync(UNIQUE_FILE, JSON.stringify(unique, null, 2));
fs.writeFileSync(DUPLICATE_FILE, JSON.stringify(duplicates, null, 2));

console.log("✅ Unique saved:", unique.length);
console.log("❌ Duplicates saved:", duplicates.length);
console.log("🔥 Done bhai!");