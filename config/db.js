const mongoose = require("mongoose");

let retryCount = 0;

const connectDB = async () => {
  try {
   
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "adminpannel",
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
  } catch (err) {
    retryCount++;
    console.error(`❌ MongoDB connection failed: ${err.message} (Attempt ${retryCount})`);

    if (retryCount <= 5) {
      setTimeout(() => {
        console.log("🔁 Retrying connection...");
        connectDB();
      }, 5000);
    } else {
      console.error("🚫 Max retry attempts reached. Exiting...");
      process.exit(1);
    }
  }
};

module.exports = connectDB;