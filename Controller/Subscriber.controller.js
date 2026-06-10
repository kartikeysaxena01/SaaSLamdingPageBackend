import Subscriber from "../models/subscriber.js";
import { transporter } from "../EmailSetup/email.js";
import dotenv from "dotenv";

dotenv.config();

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

    if (user?.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }
    if (
      user?.lastOtpSentAt &&
      now.getTime() - new Date(user.lastOtpSentAt).getTime() < 60000
    ) {
      const remaining = Math.ceil(
        (60000 - (now.getTime() - new Date(user.lastOtpSentAt).getTime())) /
          1000,
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remaining} seconds before requesting OTP`,
      });
    }

    if (!user) {
      user = new Subscriber({
        email,
        isVerified: false,
      });
    }

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 60000);
    user.lastOtpSentAt = new Date();

    await user.save();
    try {
      await transporter.sendMail({
        from: process.env.BREVO_EMAIL,
        to: email,
        subject: "Verify Your Email Address",
        html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

            <tr>
              <td align="center" style="background:#4F46E5;padding:30px;">
                <h1 style="color:white;margin:0;">Your Company</h1>
                <p style="color:#dbeafe;margin-top:10px;">
                  Secure Email Verification
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:40px;">
                <h2 style="margin-top:0;color:#111827;">
                  Verify Your Email
                </h2>

                <p style="color:#4b5563;line-height:1.7;">
                  Thanks for joining us. Use the verification code below to complete your email verification.
                </p>

                <div style="text-align:center;margin:35px 0;">
                  <div style="
                    display:inline-block;
                    padding:18px 40px;
                    font-size:34px;
                    font-weight:bold;
                    letter-spacing:10px;
                    background:#eef2ff;
                    color:#4F46E5;
                    border-radius:12px;
                  ">
                    ${otp}
                  </div>
                </div>

                <p style="color:#6b7280;">
                  This code will expire in <strong>60 seconds</strong>.
                </p>

                <p style="color:#6b7280;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:25px;text-align:center;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-size:13px;">
                  © 2026 Your Company. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
      });

      console.log("OTP email sent successfully");
    } catch (mailError) {
      console.log("Email error:", mailError.message);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("Subscribe Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
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
    if (
      !user.otpExpiresAt ||
      new Date(user.otpExpiresAt).getTime() < Date.now()
    ) {
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
    
    try {
      await transporter.sendMail({
        from: process.env.BREVO_EMAIL,
        to: email,
        subject: "Welcome to Your Company 🎉",
        html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

            <tr>
              <td align="center" style="background:#10B981;padding:40px;">
                <div style="font-size:60px;">🎉</div>
                <h1 style="color:white;margin:10px 0 0 0;">
                  Welcome Aboard
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:45px;">
                <h2 style="color:#111827;">
                  Your Email Has Been Verified
                </h2>

                <p style="color:#4b5563;line-height:1.8;">
                  Congratulations! Your account has been successfully verified and you're now part of our community.
                </p>

                <p style="color:#4b5563;line-height:1.8;">
                  You can now enjoy all features, updates, and future product releases.
                </p>

                <div style="text-align:center;margin:35px 0;">
                  <a
                    href="https://modern-saas-landing-gamma.vercel.app/"
                    style="
                      background:#10B981;
                      color:white;
                      text-decoration:none;
                      padding:16px 32px;
                      border-radius:10px;
                      display:inline-block;
                      font-weight:bold;
                    "
                  >
                    Get Started
                  </a>
                </div>

                <p style="color:#6b7280;">
                  Thank you for trusting us.
                </p>

                <p style="color:#111827;font-weight:bold;">
                  — Team Your Company
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f9fafb;padding:25px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-size:13px;">
                  © 2026 Your Company. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
      });
console.log("After welcome email");
      console.log("Welcome email sent");
    } catch (mailError) {
      console.log("Welcome email error:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export { subscribeUser, verifyOTP };
