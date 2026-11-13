import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import db from "../config/db.ts";
import { sendOtpEmail } from "../src/utils/sendEmail.ts";

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000;

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendVerificationCode = async (email: string, otp: string) => {
  try {
    await sendOtpEmail(email, otp);
    return true;
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    return false;
  }
};

const emailDeliveryError = {
  error:
    "We couldn't send the verification email right now. Please try again later.",
};

// REGISTER ROUTE
router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0 && existingUser.rows[0].is_verified) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = createOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Only create/update the account after the email was actually sent.
    const otpSent = await sendVerificationCode(email, otp);
    if (!otpSent) {
      return res.status(502).json(emailDeliveryError);
    }

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // The account exists but was never verified: let the user retry by
      // refreshing the password and issuing a new code.
      await db.query(
        "UPDATE users SET password = $1, otp = $2, otp_expires_at = $3, is_verified = FALSE WHERE email = $4",
        [hashedPassword, otp, otpExpiresAt, email],
      );

      return res.status(200).json({
        message: "We sent a new verification code to your email.",
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
      });
    }

    const newUser = await db.query(
      "INSERT INTO users (email, password, otp, otp_expires_at, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, email, created_at",
      [email, hashedPassword, otp, otpExpiresAt],
    );

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email for the OTP code.",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// VERIFY OTP ROUTE
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

    await db.query(
      "UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE email = $1",
      [email],
    );

    // Sign the user in straight away so registration can land on the homepage
    const payload = { userId: user.id, email: user.email };
    const secret = process.env.JWT_SECRET as string;
    const expiresIn = (process.env.JWT_EXPIRES_IN || "1h") as any;
    const token = jwt.sign(payload, secret, { expiresIn });

    return res.json({
      message: "Email verified successfully!",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// RESEND OTP ROUTE
router.post("/resend-otp", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
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
      return res
        .status(400)
        .json({ error: "This email is already verified. Try signing in." });
    }

    const otp = createOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Send first so the stored code always matches a delivered email.
    const otpSent = await sendVerificationCode(email, otp);
    if (!otpSent) {
      return res.status(502).json(emailDeliveryError);
    }

    await db.query(
      "UPDATE users SET otp = $1, otp_expires_at = $2 WHERE email = $3",
      [otp, otpExpiresAt, email],
    );

    return res.json({
      message: "A new verification code was sent to your email.",
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

// GOOGLE SIGN-IN VIA AUTH0 (authorization-code flow)
//
// The client sends the ?code= that Auth0 left on /auth/callback. We swap it
// for tokens using the client secret, read the verified profile from Auth0's
// /userinfo endpoint, find-or-create the local account, then issue the same
// JWT the email/password login issues — so every protected route keeps
// working unchanged.
interface Auth0Profile {
  email?: string;
  email_verified?: boolean;
  name?: string;
}

const auth0ConfigError = {
  error:
    "Google sign-in isn't configured on the server yet. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET.",
};

router.post("/google", async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    console.error(
      "Auth0 env vars missing: set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET",
    );
    return res.status(503).json(auth0ConfigError);
  }

  try {
    // 1. Exchange the one-time code for tokens (needs the client secret).
    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = (await tokenResponse.json().catch(() => null)) as
      | { access_token?: string; error_description?: string }
      | null;

    if (!tokenResponse.ok || !tokenData?.access_token) {
      console.error("Auth0 token exchange failed:", tokenData);
      return res.status(401).json({
        error:
          "Google sign-in failed. Please go back and try signing in again.",
      });
    }

    // 2. Read the verified profile (email comes straight from Google).
    const profileResponse = await fetch(`https://${domain}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = (await profileResponse.json().catch(() => null)) as
      | Auth0Profile
      | null;

    if (!profileResponse.ok || !profile?.email) {
      console.error("Auth0 userinfo failed:", profile);
      return res.status(401).json({
        error: "Couldn't read your Google profile. Please try again.",
      });
    }

    const email = profile.email.toLowerCase();

    // 3. Find or create the local account. Google has verified the email, so
    // an existing unverified account can be trusted and verified here.
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    let user = existing.rows[0];

    if (user) {
      if (!user.is_verified) {
        await db.query(
          "UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE email = $1",
          [email],
        );
        user = { ...user, is_verified: true };
      }
    } else {
      // The password column is never used for Google accounts; fill it with
      // an unpredictable hash so it can never be guessed.
      const unusablePassword = await bcrypt.hash(
        randomBytes(32).toString("hex"),
        10,
      );
      const created = await db.query(
        "INSERT INTO users (email, password, is_verified) VALUES ($1, $2, TRUE) RETURNING id, email, created_at",
        [email, unusablePassword],
      );
      user = created.rows[0];
    }

    // 4. Issue the app's usual JWT.
    const payload = { userId: user.id, email: user.email };
    const secret = process.env.JWT_SECRET as string;
    const expiresIn = (process.env.JWT_EXPIRES_IN || "1h") as any;
    const token = jwt.sign(payload, secret, { expiresIn });

    return res.json({
      message: "Logged in with Google",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
