import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.ts";
import { sendOtpEmail } from "../src/utils/sendEmail.ts";

const router = express.Router();
// REGISTER ROUTE
router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const userExists = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit OTP and set expiration (10 minutes from now)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Insert user with OTP and is_verified set to FALSE
    const newUser = await db.query(
      "INSERT INTO users (email, password, otp, otp_expires_at, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, email, created_at",
      [email, hashedPassword, otp, otpExpiresAt], 
    );

    // Send the OTP via Gmail
    await sendOtpEmail(email, otp);

    return res.status(201).json({
      message:
        "User registered successfully. Please check your Gmail for the OTP code.",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// VERIFY OTP ROUTE (New Route)
router.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: "User is already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Mark user as verified and clear OTP fields
    await db.query(
      "UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE email = $1",
      [email],
    );

    return res.json({
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// LOGIN ROUTE
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Check if email has been verified via OTP
    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "Please verify your email with the OTP first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = { userId: user.id, email: user.email };
    const secret = process.env.JWT_SECRET as string;
    const expiresIn = (process.env.JWT_EXPIRES_IN || "1h") as any;

    const token = jwt.sign(payload, secret, { expiresIn });

    return res.json({
      message: "Logged in successfully",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
