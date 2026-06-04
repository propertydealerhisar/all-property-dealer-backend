const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
    },
    HeroImg: {
      url: {
        type: String,
        required: function () {
          return this.status !== "draft";
        },
      },
      public_id: {
        type: String,
        required: function () {
          return this.status !== "draft";
        },
      },
    },
    HeroAltText: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
    },
    Category: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
    },
    Tags: [{ type: String }],
    Title: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
    },
    Subtitle: { type: String },
    MetaTitle: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
    },
    MetaDescription: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
    },
    MetaKeywords: [{ type: String }],
    Content: [
      {
        content: {
          type: String,
          required: function () {
            const parent = this.ownerDocument ? this.ownerDocument() : this;
            return parent.status !== "draft";
          },
        },
        img: {
          url: { type: String },
          public_id: { type: String },
          altText: { type: String },
        },
      },
    ],
    FAQs: [
      {
        Q: { type: String },
        A: { type: String },
      },
    ],
    Date: {
      type: Date,
      required: function () {
        return this.status !== "draft";
      },
    },
    // Author: {
    //   type: String,
    //   required: function () {
    //     return this.status !== "draft";
    //   },
    // },
    Slug: {
      type: String,
      unique: true,
      required: function () {
        return this.status !== "draft";
      },
    },
     status: {
      type: String,
      enum: ["draft", "schedule", "publish"],
      default: "publish",
    },
   migrated: { type: Boolean, default: false },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);





















// const mongoose = require("mongoose");

// const blogSchema = new mongoose.Schema({

//   id: Number,

//   slug: String,

//   title: {
//     rendered: String
//   },

//   content: {
//     rendered: String
//   },

//   excerpt: {
//     rendered: String
//   },

//   date: String,

//   categories: [Number],

//   heroImg: String,   // yahan first image save hogi

//   domain: String

// }, { strict: false });

// module.exports = mongoose.model("Blog", blogSchema);
