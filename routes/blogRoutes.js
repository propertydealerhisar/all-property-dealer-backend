// const express = require("express");
// const router = express.Router();

// const { importJsonDirect } = require("../controllers/blogController");

// router.get("/import-json", importJsonDirect);

// module.exports = router;
const express = require("express");
const router = express.Router();

const { getBlogs, getSingleBlog } = require("../controllers/blogController");

router.get("/", getBlogs);

router.get("/slug/:slug", getSingleBlog);

module.exports = router;
