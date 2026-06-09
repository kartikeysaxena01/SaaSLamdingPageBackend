import express from "express";
import { subscribeUser, verifyOTP } from "../Controller/Subscriber.controller.js";
import {otpLimiter} from "../config/ratelimit.js";

const router = express.Router();

router.post("/subscribe",otpLimiter,subscribeUser);
router.post("/verify-otp", otpLimiter, verifyOTP);

export default router;