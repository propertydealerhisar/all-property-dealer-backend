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

app.use("/api/auth", authRoutes);
app.use("/api/get", getRoutes);
app.use("/api/dealers", dealerRoutes);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
