import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.ts";
import habitRoutes from "./routes/habit.routes.ts";
import verifyToken from "./middlewares/auth.middlewares.ts";

// Load mode-specific env file first (.env.development / .env.production), then shared .env.
// Existing values are not overridden, so the mode file wins.
dotenv.config({ path: `.env.${process.env.NODE_ENV ?? "development"}` });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOrigin = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: [
    ...corsOrigin,
    "https://habit-streaks-snowy.vercel.app",
    "https://habit-streaks-k22x.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Root health check (app.get, not app.use — app.use("/") would swallow every request)
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("Hello from server");
});
app.use("/api/auth", authRoutes);
app.use("/api/habits", verifyToken, habitRoutes);

// Protected Route Example
app.get("/api/protected", verifyToken, (req: Request, res: Response) => {
  res.json({
    message: "Access granted to protected route!",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
