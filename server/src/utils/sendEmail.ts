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
    from: process.env.EMAIL_USER,
    to,
    subject: "Your Verification Code",
    html: `<h3>Your OTP code is: <b>${otp}</b></h3><p>This code expires in 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
