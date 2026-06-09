import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import SubscriberRoutes from "./routes/subscribe.route.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "https://modern-saas-landing-gamma.vercel.app/",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", SubscriberRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
});
const port=8000;
console.log(port);
app.listen(port, () => {
  console.log("Server running");
});
