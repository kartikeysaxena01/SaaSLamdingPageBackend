import Subscriber from "../models/Subscriber.js";
import transporter from "../EmailSetup/email.js";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const otp = generateOtp();
    const now = new Date();

    let user = await Subscriber.findOne({ email });

    if (user?.isVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    if (
      user &&
      user.lastOtpSentAt &&
      now.getTime() - user.lastOtpSentAt.getTime() < 60 * 1000
    ) {
      const remainingSeconds = Math.ceil(
        (60 * 1000 -
          (now.getTime() - user.lastOtpSentAt.getTime())) /
          1000
      );

      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
      });
    }

    if (!user) {
      user = new Subscriber({
        email,
        isVerified: false,
      });
    }

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 60 * 1000);
    user.lastOtpSentAt = new Date();

    await user.save();

    await transporter.sendMail({
      from: `"Newsletter" <${process.env.GOOGLE_USER}>`,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">

            <table width="600" style="background:#ffffff;margin-top:30px;border-radius:12px;overflow:hidden;">

              <tr>
                <td style="background:#4F46E5;padding:25px;text-align:center;">
                  <h1 style="color:white;margin:0;">
                    Email Verification
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding:40px;">

                  <h2>Hello 👋</h2>

                  <p>
                    Thank you for subscribing.
                    Use the OTP below to verify your email.
                  </p>

                  <div style="
                    background:#EEF2FF;
                    padding:25px;
                    text-align:center;
                    border-radius:10px;
                    margin:30px 0;
                  ">
                    <h1 style="
                      margin:0;
                      color:#4F46E5;
                      font-size:40px;
                      letter-spacing:8px;
                    ">
                      ${otp}
                    </h1>
                  </div>

                  <p>
                    This OTP expires in
                    <strong>30 seconds</strong>.
                  </p>

                  <p>
                    If you didn't request this email,
                    you can safely ignore it.
                  </p>

                </td>
              </tr>

              <tr>
                <td style="
                  background:#F9FAFB;
                  text-align:center;
                  padding:20px;
                  color:#6B7280;
                  font-size:14px;
                ">
                  © 2026 Newsletter
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

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await Subscriber.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User is already verified",
      });
    }

    if (
      !user.otpExpiresAt ||
      user.otpExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    user.lastOtpSentAt = null;

    await user.save();

    await transporter.sendMail({
      from: `"Newsletter" <${process.env.GOOGLE_USER}>`,
      to: email,
      subject: "Welcome 🎉",
      html: `
      <div style="font-family:Arial,sans-serif;padding:20px;background:#f4f4f4;">
        <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
          
          <h1 style="color:#4F46E5;">
            Welcome 🎉
          </h1>

          <p>
            Your email has been successfully verified.
          </p>

          <p>
            Thank you for subscribing to our newsletter.
            You'll now receive updates, tips, announcements,
            and exclusive content directly in your inbox.
          </p>

          <hr style="margin:25px 0;">

          <p>
            Best Regards,<br>
            <strong>Newsletter Team</strong>
          </p>

        </div>
      </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
export {
  verifyOTP,
  subscribeUser
}