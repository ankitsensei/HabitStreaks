import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {  
    rejectUnauthorized: false, // Required for secure Neon connections
  },
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
