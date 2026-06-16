const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Blog = require("./models/Blog");

// ================= DB CONNECT =================

mongoose
  .connect(
    "mongodb+srv://propertydealerhisar_db_user:WYMYaG4KiL982gCX@hisarcluster.cvuji6o.mongodb.net/Dealers_DataBase?retryWrites=true&w=majority&appName=HisarCluster"
  )
  .then(() => console.log("DB Connected ✅"))
  .catch((err) => console.log("DB Error ❌", err));

// ================= CLOUDINARY CONFIG =================

cloudinary.config({
  cloud_name: "dwzhfxo6e",
  api_key: "573395462426257",
  api_secret: "xeQHHo2Y1ucOkzVkoauEfNjvl6U",
});

// ================= MAIN FUNCTION =================

async function migrateBlogImages() {
  try {
    const blogs = await Blog.find({});

    console.log(`Total Blogs Found: ${blogs.length}\n`);

    for (const blog of blogs) {
      console.log("\n=================================");
      console.log(`Processing Blog: ${blog.Title}`);
      console.log("=================================\n");

      // ===================================================
      // DEBUG BLOG
      // ===================================================

      console.log("HeroImg:", blog?.HeroImg);

      // ===================================================
      // HERO IMAGE
      // ===================================================

      if (blog?.HeroImg?.url) {
        try {
          console.log("Uploading Hero Image...");
          console.log("Old URL:", blog.HeroImg.url);

          const heroUpload = await cloudinary.uploader.upload(
            blog.HeroImg.url,
            {
              folder: "All_Property_Dealers_Blogs",
              format: "webp",
            }
          );

          console.log("New URL:", heroUpload.secure_url);

          blog.HeroImg.url = heroUpload.secure_url;
          blog.HeroImg.public_id = heroUpload.public_id;

          console.log("Hero Image Uploaded ✅");
        } catch (err) {
          console.log("Hero Upload Error ❌");
          console.log(err.message);
        }
      } else {
        console.log("No Hero Image Found ❌");
      }

      // ===================================================
      // CONTENT IMAGES
      // ===================================================

      if (Array.isArray(blog.Content)) {
        for (let i = 0; i < blog.Content.length; i++) {
          const item = blog.Content[i];

          console.log(`Checking Content Image ${i + 1}`);

          if (item?.img?.url) {
            try {
              console.log(`Uploading Content Image ${i + 1}...`);
              console.log("Old URL:", item.img.url);

              const contentUpload =
                await cloudinary.uploader.upload(
                  item.img.url,
                  {
                    folder: "All_Property_Dealers_Blogs",
                    format: "webp",
                  }
                );

              console.log(
                "New URL:",
                contentUpload.secure_url
              );

              blog.Content[i].img.url =
                contentUpload.secure_url;

              blog.Content[i].img.public_id =
                contentUpload.public_id;

              console.log(
                `Content Image ${i + 1} Uploaded ✅`
              );
            } catch (err) {
              console.log(
                `Content Image ${i + 1} Error ❌`
              );
              console.log(err.message);
            }
          } else {
            console.log(
              `No Content Image Found At Index ${i}`
            );
          }
        }
      } else {
        console.log("Content Array Not Found ❌");
      }

      // ===================================================
      // SAVE BLOG
      // ===================================================

      await blog.save();

      console.log(`Blog Saved: ${blog.Title} ✅`);
    }

    console.log("\n=================================");
    console.log("ALL BLOGS MIGRATED SUCCESSFULLY ✅");
    console.log("=================================");

    process.exit();
  } catch (err) {
    console.log("MAIN ERROR ❌");
    console.log(err);

    process.exit();
  }
}

// ================= RUN SCRIPT =================

migrateBlogImages();