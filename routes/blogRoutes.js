const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blogController");

// Import JSON
router.get("/import-json", blogController.importJsonDirect);

// Update Hero Images
router.get("/import-heroimg", blogController.updateHeroImagesInDB);

// Blogs list
router.get("/", blogController.getBlogs);

// Single blog by slug
router.get("/slug/:slug", blogController.getSingleBlog);

//update hero img json sa
router.post("/update-heroimg-from-file", blogController.updateHeroImgFromFile);


module.exports = router;
