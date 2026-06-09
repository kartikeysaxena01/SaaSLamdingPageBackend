import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import SubscriberRoutes from "./routes/subscribe.route.js";

dotenv.config();

const app = express();

// ========================
// CORS CONFIG
// ========================
app.use(
  cors({
    origin: "https://modern-saas-landing-gamma.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

// ========================
// ROUTES
// ========================
app.use("/api", SubscriberRoutes);

// ========================
// ROOT TEST ROUTE (IMPORTANT FOR DEBUG)
// ========================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

// ========================
// START SERVER FIRST
// ========================
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ========================
// MONGODB CONNECTION (NON-BLOCKING)
// ========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err.message);
  });
