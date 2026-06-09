import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
    windowMs: 6* 60 * 1000, 
    max: 3, 
    message: "Too many OTP requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});