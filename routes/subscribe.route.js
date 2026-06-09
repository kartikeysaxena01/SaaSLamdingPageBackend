import express from "express";
import { subscribeUser, verifyOTP } from "../Controller/Subscriber.controller.js";


const router = express.Router();

router.post("/subscribe",subscribeUser);
router.post("/verify-otp", verifyOTP);

export default router;