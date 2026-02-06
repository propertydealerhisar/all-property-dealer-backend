const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({

  id: Number,

  slug: String,

  title: {
    rendered: String
  },

  content: {
    rendered: String
  },

  excerpt: {
    rendered: String
  },

  date: String,

  categories: [Number],

  heroImg: String,   // yahan first image save hogi

  domain: String

}, { strict: false });

module.exports = mongoose.model("Blog", blogSchema);
