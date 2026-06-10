import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import SubscriberRoutes from "./routes/subscribe.route.js";
import fs from "fs";

const app = express();

app.use(
  cors({
    origin:"*",
    credentials: true,
  })
);

app.use(express.json());


app.use("/api", SubscriberRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err.message);
  });
