/** Conservative, account-scoped CJ API point admission for Pillow presale.
 * Reservations are never released after a transport failure: CJ may have charged.
 */
import { createHash, randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import { isInMemoryDatabasePath } from "../../brain/sqlite-database.js";
import type { CjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";

const POINTS_BY_PATH: Readonly<Record<string, number>> = {
  "/product/list": 50,
  "/product/query": 10,
  "/product/variant/query": 10,
  "/product/stock/queryByVid": 10,
  "/logistic/freightCalculate": 10,
};

function limit(raw: string | undefined): number {
  if (!raw || !/^[1-9]\d{0,5}$/.test(raw)) return 0;
  const value = Number(raw);
  return value <= 100_000 ? value : 0;
}

export function createCjPresalePointReservation(input: {
  config: CjConfig;
  env: NodeJS.ProcessEnv;
  cycleId: string;
}): (path: string) => Promise<void> {
  const cycleLimit = limit(input.env.CJ_PRESALE_CYCLE_POINT_LIMIT);
  const dailyLimit = limit(input.env.CJ_PRESALE_DAILY_POINT_LIMIT);
  if (!cycleLimit || !dailyLimit || cycleLimit > dailyLimit) {
    throw new Error("CJ presale point budgets absent or invalid; owner-authorized cycle and UTC-day limits required");
  }
  if (!input.config.apiKey || !input.cycleId ||
      isInMemoryDatabasePath(input.env.DATABASE_PATH ?? process.env.DATABASE_PATH ?? ":memory:")) {
    throw new Error("CJ presale requires an account and disk-backed point ledger");
  }
  const accountId = createHash("sha256").update(JSON.stringify([
    input.config.apiBaseUrl, input.config.apiKey, input.config.apiSecret,
  ])).digest("hex");
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS pillow_cj_point_reservations (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL, cycle_id TEXT NOT NULL,
    day_utc TEXT NOT NULL, path TEXT NOT NULL, points INTEGER NOT NULL,
    reserved_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_pillow_cj_points_day
    ON pillow_cj_point_reservations(account_id, day_utc);
  CREATE INDEX IF NOT EXISTS idx_pillow_cj_points_cycle
    ON pillow_cj_point_reservations(account_id, cycle_id);`);

  return async (path: string): Promise<void> => {
    const points = POINTS_BY_PATH[path];
    if (!points) throw new Error(`CJ presale point cost unknown for ${path}`);
    const day = new Date().toISOString().slice(0, 10);
    // Synchronous read and insert give this process one admission order; a
    // second request sees the pending reservation before either disk export.
    const cycleUsed = (db.prepare(`SELECT COALESCE(SUM(points), 0) AS n
      FROM pillow_cj_point_reservations WHERE account_id = @accountId AND cycle_id = @cycleId`)
      .get({ accountId, cycleId: input.cycleId }) as { n: number }).n;
    const dayUsed = (db.prepare(`SELECT COALESCE(SUM(points), 0) AS n
      FROM pillow_cj_point_reservations WHERE account_id = @accountId AND day_utc = @day`)
      .get({ accountId, day }) as { n: number }).n;
    if (cycleUsed + points > cycleLimit || dayUsed + points > dailyLimit) {
      throw new Error("CJ presale point budget exhausted; request withheld");
    }
    const id = randomUUID();
    db.prepare(`INSERT INTO pillow_cj_point_reservations
      (id, account_id, cycle_id, day_utc, path, points, reserved_at)
      VALUES (@id, @accountId, @cycleId, @day, @path, @points, @at)`)
      .run({ id, accountId, cycleId: input.cycleId, day, path, points, at: new Date().toISOString() });
    await db.requestCriticalPersist();
    const receipt = db.prepare(`SELECT points FROM pillow_cj_point_reservations WHERE id = @id`)
      .get({ id }) as { points: number } | undefined;
    if (receipt?.points !== points) throw new Error("CJ point reservation readback failed");
  };
}
