import Subscriber from "../models/subscriber.js";
import { createTransporter } from "../EmailSetup/email.js";

// Generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* =========================
   SUBSCRIBE USER (SEND OTP)
========================= */
const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const now = new Date();
    const otp = generateOtp();

    let user = await Subscriber.findOne({ email });

    // If already verified
    if (user?.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Cooldown check (60 sec)
    if (
      user?.lastOtpSentAt &&
      now.getTime() - new Date(user.lastOtpSentAt).getTime() < 60 * 1000
    ) {
      const remainingSeconds = Math.ceil(
        (60 * 1000 -
          (now.getTime() - new Date(user.lastOtpSentAt).getTime())) /
          1000
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
      });
    }

    // Create user if not exists
    if (!user) {
      user = new Subscriber({
        email,
        isVerified: false,
      });
    }

    // Save OTP data
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 60 * 1000);
    user.lastOtpSentAt = new Date();

    await user.save();

    // =========================
    // SEND EMAIL (FIXED PART)
    // =========================
    try {
      const transporter = await createTransporter();

      await transporter.sendMail({
        from: `"Newsletter" <${process.env.GOOGLE_USER}>`,
        to: email,
        subject: `Your Verification Code: ${otp}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
            <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
              <h2 style="color:#4F46E5;">Email Verification</h2>
              <p>Use the OTP below:</p>
              <h1 style="text-align:center;letter-spacing:8px;">${otp}</h1>
              <p>This OTP expires in <strong>60 seconds</strong>.</p>
            </div>
          </div>
        `,
      });

      console.log("OTP email sent successfully");
    } catch (mailError) {
      console.log("Email sending failed:", mailError);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
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
        message: "User is already verified",
      });
    }

    if (
      !user.otpExpiresAt ||
      new Date(user.otpExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
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

    // Welcome email
    try {
      const transporter = await createTransporter();

      await transporter.sendMail({
        from: `"Newsletter" <${process.env.GOOGLE_USER}>`,
        to: email,
        subject: "Welcome 🎉",
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;background:#f4f4f4;">
            <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
              <h1 style="color:#4F46E5;">Welcome 🎉</h1>
              <p>Your email has been successfully verified.</p>
              <p>Thank you for subscribing!</p>
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.log("Welcome email failed:", mailError);
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export {
  subscribeUser,
  verifyOTP,
};