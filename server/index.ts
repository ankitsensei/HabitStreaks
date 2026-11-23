/// <reference path="./src/types/express.d.ts" />
import { join, sep } from "node:path";
import compression from "compression";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
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
// JSON is the bulk of every API response — gzip it before it hits the wire.
// compression() skips responses under 1 kB and ones the client can't decode.
app.use(compression());
app.use(express.json());

// Nothing is cacheable unless a handler below opts in. API responses are
// per-user and change on every toggle, so they must never be stored by the
// browser or an intermediate proxy — a stale habits list reads as lost work.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

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

// Built client (client/dist), when a deployment ships it — the Vercel client
// project serves its own copy, so a missing directory is simply a no-op.
// Vite fingerprints every file under assets/, so those URLs may be cached
// forever; index.html is not hashed and has to be revalidated, or a stale
// entry would keep loading an old bundle.
const clientDist = join(import.meta.dirname, "..", "client", "dist");

app.use(
  express.static(clientDist, {
    index: false,
    setHeaders: (res, filePath) => {
      res.setHeader(
        "Cache-Control",
        filePath.includes(`${sep}assets${sep}`)
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      );
    },
  }),
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
