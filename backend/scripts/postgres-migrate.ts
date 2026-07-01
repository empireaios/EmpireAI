#!/usr/bin/env node
/** REAL-132 — Apply Postgres schema for EmpireAI Brain persistence. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePostgresPool, getPostgresPool, isPostgresEnabled } from "../src/brain/postgres/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "../src/brain/postgres/schema.sql");

async function main() {
  if (!isPostgresEnabled()) {
    console.error("DATABASE_URL is not set — cannot migrate Postgres schema.");
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, "utf8");
  const pool = getPostgresPool();
  await pool.query(sql);
  console.log("Postgres schema applied successfully.");
  await closePostgresPool();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
