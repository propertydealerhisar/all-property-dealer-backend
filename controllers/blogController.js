const fs = require("fs");
const path = require("path");
const Blog = require("../models/Blog");

exports.importJsonDirect = async (req, res) => {
  try {

    // JSON file ka path
    const filePath = path.join(__dirname, "../data/blogs.json");

    // File read karo
    const jsonData = fs.readFileSync(filePath, "utf-8");

    // JSON ko parse karo
    const blogs = JSON.parse(jsonData);

    // Seedha pura data insert karo
    await Blog.insertMany(blogs);

    res.status(200).json({
      message: "JSON data saved to DB successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error importing JSON data",
      error: error.message
    });
  }
};

// ya hero image update kartha aha

function extractFirstImage(html) {
  try {
    if (!html) return "";

    const imgTagRegex = /<img[^>]+src=["']([^"']+)["']/i;

    const match = imgTagRegex.exec(html);

    return match && match[1] ? match[1] : "";

  } catch (error) {
    return "";
  }
}

// UPDATE EXISTING BLOGS
exports.updateHeroImagesInDB = async (req, res) => {
  try {

    const blogs = await Blog.find();

    let updatedCount = 0;
    let skippedCount = 0;

    for (let blog of blogs) {

      // AGAR heroImg pehle se hai → SKIP KAR DO
      if (blog.heroImg && blog.heroImg.trim() !== "") {
        skippedCount++;
        continue;
      }

      const htmlContent = blog?.content?.rendered || "";

      if (!htmlContent) {
        continue;
      }

      // Sabhi images extract karo
      const imgTagRegex = /<img[^>]+src=["']([^"']+)["']/gi;

      let matches = [];
      let match;

      while ((match = imgTagRegex.exec(htmlContent)) !== null) {
        matches.push(match[1]);
      }

      // Agar ek bhi image nahi mili → skip
      if (matches.length === 0) {
        continue;
      }

      // Pehli available image use karo
      const selectedImage = matches[0];

      await Blog.findByIdAndUpdate(blog._id, {
        heroImg: selectedImage
      });

      updatedCount++;
    }

    res.status(200).json({
      message: "Hero images update process completed",
      totalBlogs: blogs.length,
      updatedBlogs: updatedCount,
      skippedBlogs: skippedCount
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating hero images",
      error: error.message
    });
  }
};



// BLOG LIST API (Pagination)
exports.getBlogs = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    const domain = req.query.domain;

    let filter = {};

    if (domain) {
      filter.domain = domain;
    }

    const total = await Blog.countDocuments(filter);

    const blogs = await Blog.aggregate([
      { $match: filter },
      { $sample: { size: limit } },   // 👈 RANDOM BLOGS
      // {
      //   $project: {
      //     title: 1,
      //     excerpt: 1,
      //     slug: 1,
      //     heroImg: 1,
      //     date: 1,
      //     domain: 1
      //   }
      // }
    ]);

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

// json sa img dali gai
exports.updateHeroImgFromFile = async (req, res) => {
  try {

    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        message: "File path required"
      });
    }

    // ----- YAHA APNA DOMAIN NAME LIKH DO -----
    const DOMAIN_NAME = "www.propertydealerindelhi.com";
    // -----------------------------------------

    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        message: "File not found at given path"
      });
    }

    const jsonData = fs.readFileSync(fullPath, "utf-8");

    const records = JSON.parse(jsonData);

    let updated = 0;
    let notFound = 0;
    let domainMismatch = 0;

    for (let item of records) {

      const { slug, heroImg } = item;

      if (!slug || !heroImg) {
        continue;
      }

      // 🔥 PEHLE DOMAIN + SLUG DONO MATCH HONGE
      const blog = await Blog.findOne({
        domain: DOMAIN_NAME,
        slug: slug
      });

      if (!blog) {
        notFound++;
        continue;
      }

      // Double safety – agar kisi blog ka domain alag ho
      if (blog.domain !== DOMAIN_NAME) {
        domainMismatch++;
        continue;
      }

      await Blog.updateOne(
        {
          domain: DOMAIN_NAME,
          slug: slug
        },
        { $set: { heroImg: heroImg } }
      );

      updated++;
    }

    res.status(200).json({
      message: "Hero Images Updated Successfully (Domain Wise)",
      totalRecords: records.length,
      updatedBlogs: updated,
      slugNotFound: notFound,
      domainMismatch: domainMismatch
    });

  } catch (error) {
    res.status(500).json({
      message: "Error updating hero images from file",
      error: error.message
    });
  }
};




exports.getBlogsByFixedDomains = async (req, res) => {
  try {

    const allowedDomains = [
      "www.propertydealerinfaridabad.com",
      "www.propertydealeringurgaon.com",
      "www.propertydealerinhisar.com"
    ];

    // 🔥 RANDOMIZED MIXED DATA LOGIC
    const blogs = await Blog.aggregate([
      {
        $match: {
          domain: { $in: allowedDomains }
        }
      },
      {
        $sample: { size: 1000 }   // jitna max data chahiye
      }
    ]);

    res.status(200).json({
      success: true,
      total: blogs.length,
      data: blogs
    });

  } catch (error) {
    console.log("Error in getBlogsByFixedDomains:", error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
