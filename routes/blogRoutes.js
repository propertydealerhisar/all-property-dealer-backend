const express = require("express");
const validateRequest = require("../middleware/validateRequest");
const { fetchBlogsSchema,domainQuerySchema,slugParamSchema } = require("../validations/blogValidation");
const { 
  fetchBlogs,
  getBlogBySlug,
  getSlugsByDomain
 } = require("../controllers/blogController");
const router = express.Router();

router.get("/fetchBlogs",validateRequest(fetchBlogsSchema,"query"),fetchBlogs);
router.get("/getBlogBySlug/:slug",validateRequest(slugParamSchema, "params"),validateRequest(domainQuerySchema, "query"), getBlogBySlug);
router.get("/getSlugsByDomain/:domain",getSlugsByDomain)


module.exports = router;


















// const express = require("express");
// const router = express.Router();

// const {importJsonDirect,getBlogs,getSingleBlog,updateHeroImgFromFile,getBlogsByFixedDomains,getNextBlog,getBlogSlugsByDomain} = require("../controllers/blogController");

// // Import JSON
// router.get("/import-json", importJsonDirect);

// // Update Hero Images
// // router.get("/import-heroimg", blogController.updateHeroImagesInDB);

// // Blogs list
// router.get("/", getBlogs);

// // Single blog by slug
// router.get("/slug/:slug", getSingleBlog);

// //update hero img json sa
// router.post("/update-heroimg-from-file", updateHeroImgFromFile);

// router.get("/getBlogsByFixedDomains/blogs", getBlogsByFixedDomains);

// router.get("/next/:slug", getNextBlog);
// router.get("/blogs/slugs", getBlogSlugsByDomain);

// module.exports = router;
