// const fs = require("fs");
// const path = require("path");
// const Blog = require("../models/Blog");

// exports.importJsonDirect = async (req, res) => {
//   try {

//     // JSON file ka path
//     const filePath = path.join(__dirname, "../data/blogs.json");

//     // File read karo
//     const jsonData = fs.readFileSync(filePath, "utf-8");

//     // JSON ko parse karo
//     const blogs = JSON.parse(jsonData);

//     // Seedha pura data insert karo
//     await Blog.insertMany(blogs);

//     res.status(200).json({
//       message: "JSON data saved to DB successfully"
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: "Error importing JSON data",
//       error: error.message
//     });
//   }
// };



const Blog = require("../models/Blog");

// BLOG LIST API (Pagination)
exports.getBlogs = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    const total = await Blog.countDocuments();

    const blogs = await Blog.find()
      .select("title excerpt slug heroImg date")
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalBlogs: total,
      totalPages: Math.ceil(total / limit),
      data: blogs
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getSingleBlog = async (req, res) => {
  try {

    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found"
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
