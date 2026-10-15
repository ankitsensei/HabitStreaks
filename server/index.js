import express from "express";
import "dotenv/config";
import { pool } from "./config/db.ts";
const PORT = process.env.PORT;

const app = express();

app.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");

    res.json({
      connected: true,
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ connected: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT: http://localhost:${PORT}`);
});
