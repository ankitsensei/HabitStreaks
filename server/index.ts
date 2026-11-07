import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.ts";
import verifyToken from "./middlewares/auth.middlewares.ts";
import { verifyEmailTransport } from "./src/utils/sendEmail.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Protected Route Example
app.get("/api/protected", verifyToken, (req: Request, res: Response) => {
  res.json({
    message: "Access granted to protected route!",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  void verifyEmailTransport();
});
