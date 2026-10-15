import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Database_URL is missing");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
