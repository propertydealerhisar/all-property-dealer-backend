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

    let successCount = 0;
    let failedRecords = [];

    const CHUNK_SIZE = 500;

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);

      try {
        const result = await Dealer.insertMany(chunk, { ordered: false });
        successCount += result.length;
      } catch (chunkError) {
        console.log("Chunk Insert Error:", chunkError.message);

        if (chunkError.writeErrors) {
          chunkError.writeErrors.forEach((err) => {
            failedRecords.push({
              index: err.index + i,
              error: err.errmsg,
              record: chunk[err.index],
            });
          });
        } else {
          failedRecords.push({
            error: chunkError.message,
            chunkStart: i,
          });
        }
      }
    }

    res.json({
      success: true,
      totalRecords: data.length,
      insertedRecords: successCount,
      failedRecords: failedRecords.length,
      failedDetails: failedRecords,
      message: "Import process completed",
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err);

    res.status(500).json({
      message: "Server Import Failed",
      error: err.message,
    });
  }
};
 
// area update kiya tha bhai
exports.updateAreaByDomainAndSlug = async (req, res) => {
  try {
    const { jsonPath, domain } = req.body;

    if (!jsonPath || !domain) {
      return res.status(400).json({
        message: "jsonPath and domain are required",
      });
    }

    const fullPath = path.resolve(jsonPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        message: "JSON file not found",
      });
    }

    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return res.status(400).json({
        message: "JSON must be an array",
      });
    }

    let totalProcessed = 0;
    let updatedCount = 0;
    let notFound = 0;

    for (const item of data) {
      if (!item.slug || !item.area) continue;

      totalProcessed++;

      const result = await Dealer.updateOne(
        {
          domain: domain,      // 👈 FIRST DOMAIN CHECK
          slug: item.slug      // 👈 THEN SLUG MATCH
        },
        {
          $set: {
            area: item.area    // 👈 AREA UPDATE
          }
        }
      );

      if (result.matchedCount === 0) {
        notFound++;
      }

      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    res.json({
      success: true,
      domain: domain,
      totalInJson: data.length,
      totalProcessed,
      updatedDocuments: updatedCount,
      notMatched: notFound,
      message: "Area fields updated based on domain and slug",
    });

  } catch (err) {
    console.error("AREA UPDATE ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};
