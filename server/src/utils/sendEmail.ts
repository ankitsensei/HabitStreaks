import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"HabitStreaks Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔒 Verify Your Email - HabitStreaks",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 30px; margin: 0;">
        <div style="max-width: 500px; background: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin: auto; text-align: center;">
          
          <!-- App Header -->
          <h2 style="color: #333333; margin-top: 0; font-size: 24px;">HabitStreaks</h2>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
          
          <!-- Greeting / Body -->
          <p style="color: #555555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            You're just one step away from building better habits. Use the verification code below to complete your registration.
          </p>

          <!-- OTP Box -->
          <div style="background-color: #f8f9fa; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
          </div>

          <!-- Expiration Warning -->
          <p style="color: #e11d48; font-size: 13px; font-weight: 500; margin-top: 20px;">
            ⏰ This code will expire in <strong>10 minutes</strong>.
          </p>
          
          <p style="color: #888888; font-size: 12px; margin-top: 30px; line-height: 1.4;">
            If you didn't request this code, you can safely ignore this email.
          </p>
          
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
