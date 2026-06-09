import express from "express";
import  {subscribeUser,verifyOTP}  from "../Controller/Subscriber.controller.js";
import rateLimit from "express-rate-limit";
const router = express.Router();

router.post("/subscribe", subscribeUser);
router.post("/verify-otp", rateLimit,verifyOTP);

export default router;