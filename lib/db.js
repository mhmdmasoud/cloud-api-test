import pg from "pg";

const { Pool } = pg;

let pool = null;

export function getPool() {
  const connectionString = process.env.CONTROL_DATABASE_URL;

  if (!connectionString) {
    throw new Error("CONTROL_DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase.com")
        ? { rejectUnauthorized: false }
        : undefined
    });
  }

  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}
