import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ ADD THIS HERE
export const sendMailSafe = async (options) => {
  return Promise.race([
    transporter.sendMail(options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SMTP Timeout")), 10000)
    ),
  ]);
};

    
  
