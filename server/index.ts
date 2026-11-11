import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import habitRoutes from "./routes/habit.routes";
import verifyToken from "./middlewares/auth.middlewares";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions: cors.CorsOptions = {
  origin: ["https://habit-streaks-k22x.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
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
