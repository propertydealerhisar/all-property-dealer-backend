// controllers/dealerMetaController.js

const DealerMeta =
  require("../models/DealerMeta");
// ✅ ADD DEALER META


// ✅ ADD DEALER META

const fs = require("fs");


// ✅ ADD DEALER META

const addDealerMeta = async (req, res) => {
  try {
    // ✅ JSON FILE PATH

    const { jsonPath } = req.body;

    // ✅ CHECK PATH

    if (!jsonPath) {
      return res.status(400).json({
        success: false,
        message: "JSON file path is required",
      });
    }

    // ✅ READ JSON FILE

    const rawData = fs.readFileSync(jsonPath, "utf-8");

    const jsonData = JSON.parse(rawData);

    // ✅ ARRAY CHECK

    const dataArray = Array.isArray(jsonData)
      ? jsonData
      : [jsonData];

    // ✅ INSERT DATA

    const insertedData = [];

    for (const item of dataArray) {
      const {
        location,
        metaTitle,
        metaDescription,
        pageContent,
        slug,
      } = item;

      // ✅ REQUIRED CHECK

      if (
        !location ||
        !metaTitle ||
        !metaDescription ||
        !pageContent ||
        !slug
      ) {
        continue;
      }

      // ✅ CLEAN VALUES

      const cleanLocation =
        location.trim().toLowerCase();

      const cleanSlug =
        slug.trim().toLowerCase();

      // ✅ CHECK LOCATION EXISTS

      const existingLocation =
        await DealerMeta.findOne({
          location: cleanLocation,
        });

      // ✅ AGAR LOCATION SAME HAI TO SKIP

      if (existingLocation) {
        console.log(
          `Skipped Location: ${location}`
        );
        continue;
      }

      // ✅ CHECK SLUG EXISTS

      const existingSlug =
        await DealerMeta.findOne({
          slug: cleanSlug,
        });

      // ✅ AGAR SLUG SAME HAI TO SKIP

      if (existingSlug) {
        console.log(
          `Skipped Slug: ${slug}`
        );
        continue;
      }

      // ✅ CREATE DATA

      const newMeta =
        new DealerMeta({
          location: cleanLocation,
          metaTitle,
          metaDescription,
          pageContent,
          slug: cleanSlug,
        });

      await newMeta.save();

      insertedData.push(newMeta);
    }

    // ✅ RESPONSE

    res.status(201).json({
      success: true,
      message:
        "JSON data imported successfully",
      total: insertedData.length,
      data: insertedData,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};



  //======================================================================
const getDealerMeta =
  async (req, res) => {
    try {
      const { slug } =
        req.params;
console.log("slug =>",slug)
      // ✅ FIND DATA BY SLUG

      const data =
        await DealerMeta.findOne({
          slug:
            slug.toLowerCase(),
        });

      // ✅ IF DATA NOT FOUND

      if (!data) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Dealer meta not found",
          });
      }

      // ✅ RESPONSE

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
        error:
          error.message,
      });
    }
  };

module.exports = {
  addDealerMeta,
  getDealerMeta,
};