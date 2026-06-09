import rateLimit from 'express-rate-limit';
export const otpLimiter=rateLimit=rateLimit({
    windowMs:10*60*1000,
    max:5,
    message:{
        success:false,
        message:"Too many Otp request wait for 10 minutes"
    }
})