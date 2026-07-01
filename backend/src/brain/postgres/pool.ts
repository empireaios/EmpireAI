import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

/** REAL-132 — Postgres connection pool when DATABASE_URL is configured. */
export function isPostgresEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPostgresPool(): pg.Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for Postgres mode");
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
