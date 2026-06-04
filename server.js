const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// ================= CONNECT DB =================
connectDB().then(async () => {
  console.log("🚀 DB Connected");
});

// ================= MIDDLEWARE =================

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://propertydeler-gold-frontend.vercel.app",
    "https://propertydeler-gold-frontend-yg8l.vercel.app",
    "https://propertydeler-gold-frontend-lp3d.vercel.app",
    "https://propertydeler-gold-frontend-w423.vercel.app",
    "https://propertydeler-gold-frontend-xkw9.vercel.app",
    "https://propertydeler-gold-frontend-33ts.vercel.app",
    "https://propertydeler-gold-frontend-k2da.vercel.app",
    "https://propertydeler-gold-frontend-9wvp.vercel.app",
   "https://property-dealer-in-hisar-2.vercel.app",
   "https://property-dealer-in-hisar-2.vercel.app/",
   "https://www.property-dealer-in-hisar-2.vercel.app/",
   "https://www.property-dealer-in-hisar-2.vercel.app",
   "https://propertydealerinhisar.com",
   "https://www.propertydealerinhisar.com",
   "https://propertydealerinfaridabad.com/",
   "https://www.propertydealerinfaridabad.com",
   "https://propertydealerinnoida.com/",
   "https://www.propertydealerinnoida.com",
   "https://propertydealeringurgaon.com/",
   "https://www.propertydealeringurgaon.com",
   "https://propertydealerindelhi.com/",
   "https://www.propertydealerindelhi.com",
   "https://propertydealersnearme.com",
   "https://www.propertydealersnearme.com",
   "https://realestateagentsnearme.in",
   "https://www.realestateagentsnearme.in",
    "https://www.projectwallah.live",
    "https://all-property-dealers.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

// ================= ROUTES =================

app.get("/", (req, res) => {
  res.send("✅ API Running...");
});

const authRoutes = require("./routes/auth");
const dealerRoutes = require("./routes/dealer.routes");
const getRoutes = require("./routes/get.routes");
const blogRoutes = require("./routes/blogRoutes");
const tagsRoutes = require("./routes/tag.routes");
const getroutes = require("./routes/get.routes");
const dealerMetaRoutes =require("./routes/dealerMetaRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/get", getRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/blogs", blogRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api", getroutes );
app.use("/api/add",dealerMetaRoutes);
app.use("/api/area", require("./routes/areaDetailes"));
  //project2 ki api

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
