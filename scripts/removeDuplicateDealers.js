import mongoose from "mongoose";
import fs from "fs";
import Dealer from "./models/Dealer.js"; // apna model path

await mongoose.connect("mongodb://127.0.0.1:27017/yourDB");

const all = await Dealer.find();

const seen = new Map();
const deleted = [];
let removedCount = 0;

for (let item of all) {
  if (!item.name) continue;

  const key = item.name.trim().toLowerCase();

  if (seen.has(key)) {
    await Dealer.deleteOne({ _id: item._id });
    deleted.push({
      _id: item._id,
      name: item.name,
      address: item.address,
    });

    console.log("🗑️ Deleted:", item.name, item._id.toString());
    removedCount++;
  } else {
    seen.set(key, item._id.toString());
  }
}

// save deleted log
fs.writeFileSync(
  "./deleted_duplicates.json",
  JSON.stringify(deleted, null, 2)
);

console.log("================================");
console.log("✅ Total checked:", all.length);
console.log("🗑️ Deleted:", removedCount);
console.log("📁 deleted_duplicates.json file created");

process.exit();
