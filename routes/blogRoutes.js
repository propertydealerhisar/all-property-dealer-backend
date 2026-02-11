const express = require("express");
const router = express.Router();

const {importJsonDirect,getBlogs,getSingleBlog,updateHeroImgFromFile,getBlogsByFixedDomains} = require("../controllers/blogController");

// Import JSON
router.get("/import-json", importJsonDirect);

// Update Hero Images
// router.get("/import-heroimg", blogController.updateHeroImagesInDB);

// Blogs list
router.get("/", getBlogs);

// Single blog by slug
router.get("/slug/:slug", getSingleBlog);

//update hero img json sa
router.post("/update-heroimg-from-file", updateHeroImgFromFile);

router.get("/getBlogsByFixedDomains/blogs", getBlogsByFixedDomains);

module.exports = router;
