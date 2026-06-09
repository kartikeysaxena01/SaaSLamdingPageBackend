import nodemailer from "nodemailer";
import { google } from "googleapis";
import config from "../config/config.js";

const oAuth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: config.GOOGLE_REFRESH_TOKEN,
});

// optional cache (recommended)
let cachedTransporter = null;

export const createTransporter = async () => {
  try {
    if (cachedTransporter) return cachedTransporter;

    const accessToken = await oAuth2Client.getAccessToken();

    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken?.token || accessToken,
      },
    });

    return cachedTransporter;
  } catch (error) {
    console.log("❌ Transporter creation failed:", error);
    throw error;
  }
};