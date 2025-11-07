import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  application_name: "unified-host-tool",
});

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "test") {
    console.log("Connected to PostgreSQL");
  }
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
});

export async function query(text, params) {
  return pool.query(text, params);
}
