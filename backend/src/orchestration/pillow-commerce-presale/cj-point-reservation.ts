/** Conservative, account-scoped CJ API point admission for Pillow presale.
 * Reservations are never released after a transport failure: CJ may have charged.
 */
import { createHash } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import { isInMemoryDatabasePath } from "../../brain/sqlite-database.js";
import type { CjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";
import { cjPointLedgerPath, reserveCjPoints } from "./cj-native-point-ledger.js";

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
  const accountId = input.env.CJ_PRESALE_ACCOUNT_ID;
  if (!input.config.apiKey || !accountId || !/^[A-Za-z0-9_-]{3,64}$/.test(accountId) ||
      !input.cycleId || input.cycleId.length > 128 ||
      isInMemoryDatabasePath(input.env.DATABASE_PATH ?? process.env.DATABASE_PATH ?? ":memory:")) {
    throw new Error("CJ presale requires a stable account identifier and disk-backed point ledger");
  }
  const filename = cjPointLedgerPath(input.env.DATABASE_PATH ?? process.env.DATABASE_PATH ?? ":memory:");
  const credentialSha256 = createHash("sha256").update(JSON.stringify([
    input.config.apiBaseUrl, input.config.apiKey, input.config.apiSecret,
  ])).digest("hex");
  const legacyReservationsPresent = (): boolean => {
    const brain = getDatabase();
    const table = brain.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pillow_cj_point_reservations'").get();
    return Boolean(table && brain.prepare("SELECT 1 FROM pillow_cj_point_reservations LIMIT 1").get());
  };
  // Never reset a preexisting day's reservations by silently changing ledgers.
  if (legacyReservationsPresent()) throw new Error("Legacy CJ point history requires verified migration before dispatch");

  return async (path: string): Promise<void> => {
    const points = POINTS_BY_PATH[path];
    if (!points) throw new Error(`CJ presale point cost unknown for ${path}`);
    const day = new Date().toISOString().slice(0, 10);
    if (legacyReservationsPresent()) throw new Error("Legacy CJ point history requires verified migration before dispatch");
    reserveCjPoints({ filename, accountId, credentialSha256, cycleId: input.cycleId,
      day, requestPath: path, points, cycleLimit, dailyLimit });
  };
}
