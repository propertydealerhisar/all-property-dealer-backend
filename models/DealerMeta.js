const mongoose =
  require("mongoose");

const dealerMetaSchema =
  new mongoose.Schema(
    {
      // ✅ LOCATION NAME

      location: {
        type: String,
        required: [
          true,
          "Location is required",
        ],
        trim: true,
      },

      // ✅ REQUIRED SEO FIELDS

      metaTitle: {
        type: String,
        required: [
          true,
          "Meta title is required",
        ],
        trim: true,
      },

      metaDescription: {
        type: String,
        required: [
          true,
          "Meta description is required",
        ],
        trim: true,
      },

      pageContent: {
        type: String,
        required: [
          true,
          "Page content is required",
        ],
        trim: true,
      },
         slug: {
        type: String,
        required: [
          true,
          "Slug is required",
        ],
        unique: true,
        lowercase: true,
        trim: true,
      },
    },
    
  );

module.exports =
  mongoose.model(
    "DealerMeta",
    dealerMetaSchema
  );