const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// 🔁 Auto import function (one-time use)
const importDealersOnce = require("./utils/importDealers");

// ================= CONNECT DB =================
connectDB().then(async () => {
  console.log("🚀 DB Connected");

  // 🟢 AUTO IMPORT FROM JSON (RUN ONLY ONCE)
  // await importDealersOnce();
});

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cors());

// ================= ROUTES =================

// health check
app.get("/", (req, res) => {
  res.send("✅ API Running...");
});

// routes import
const authRoutes = require("./routes/auth");
const dealerRoutes = require("./routes/dealer.routes");
const getRoutes = require("./routes/get.routes");

// routes use
app.use("/api/auth", authRoutes);
app.use("/api/get", getRoutes);

// 🔥 MAIN DEALER ROUTE (DOMAIN BASED)
app.use("/api/dealers", dealerRoutes);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
