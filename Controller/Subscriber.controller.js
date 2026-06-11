import Subscriber from "../models/subscriber.js";
import { sendMailSafe } from "../EmailSetup/email.js";
import dotenv from "dotenv";

dotenv.config();

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const now = new Date();
    const otp = generateOtp();

    let user = await Subscriber.findOne({ email });

    if (user?.isVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    if (
      user?.lastOtpSentAt &&
      now - new Date(user.lastOtpSentAt) < 60000
    ) {
      const remaining = Math.ceil(
        (60000 - (now - new Date(user.lastOtpSentAt))) / 1000
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remaining}s before requesting OTP`,
      });
    }

    if (!user) {
      user = new Subscriber({ email, isVerified: false });
    }

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 60000);
    user.lastOtpSentAt = new Date();

    await user.save();

    console.log("📩 Sending OTP email...");

    await sendMailSafe({
      from: process.env.BREVO_EMAIL,
      to: email,
      subject: "Verify Your Email Address",
      html: `<h2>Your OTP is ${otp}</h2>`,
    });

    console.log("OTP email sent");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.log("Subscribe Error FULL:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await Subscriber.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Already verified",
      });
    }

    if (!user.otpExpiresAt || Date.now() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    user.lastOtpSentAt = null;

    await user.save();

    console.log("📩 Sending welcome email...");

    await sendMailSafe({
      from: process.env.BREVO_EMAIL,
      to: email,
      subject: "Welcome 🎉",
      html: `<h1>Welcome to our platform 🎉</h1>`,
    });

    console.log("Welcome email sent");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.log("Verify Error FULL:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export { subscribeUser, verifyOTP };
