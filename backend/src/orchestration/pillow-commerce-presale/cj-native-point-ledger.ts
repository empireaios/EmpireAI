/** Dedicated, transactional CJ point ledger. A busy writer fails closed. */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const APP_ID = 0x454d4350;
const MAX_BYTES = 16 * 1024 * 1024;
export function cjPointLedgerPath(primary: string): string {
  if (!path.isAbsolute(primary) || path.resolve(primary) !== primary) throw new Error("Absolute disk-backed CJ point ledger required");
  return primary + ".cj-points.sqlite";
}
function syncDirectory(directory: string): void {
  if (process.platform === "win32") throw new Error("CJ ledger requires POSIX directory durability");
  const fd = fs.openSync(directory, "r");
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function withLedger<T>(filename: string, fn: (db: DatabaseSync) => T): T {
  const directory = path.dirname(filename);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  let created = false;
  try { fs.closeSync(fs.openSync(filename, "wx", 0o600)); created = true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.nlink !== 1 || stat.size > MAX_BYTES || fs.realpathSync(filename) !== filename) {
    throw new Error("CJ point ledger is not a bounded canonical regular file");
  }
  if (created) syncDirectory(directory);
  const db = new DatabaseSync(filename, { timeout: 0, allowExtension: false });
  let transaction = false;
  try {
    db.exec("PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=0; PRAGMA synchronous=EXTRA;");
    if (db.prepare("PRAGMA synchronous").get()?.synchronous !== 3 ||
        db.prepare("PRAGMA journal_mode").get()?.journal_mode !== "delete" ||
        db.prepare("PRAGMA page_size").get()?.page_size !== 4096) throw new Error("CJ ledger durability mode unsupported");
    const tables = db.prepare("SELECT type,name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
    const app = db.prepare("PRAGMA application_id").get()?.application_id;
    const version = db.prepare("PRAGMA user_version").get()?.user_version;
    const fresh = tables.length === 0 && app === 0 && version === 0;
    if (!fresh && (app !== APP_ID || version !== 1 ||
        tables.map(t => `${t.type}:${t.name}`).join() !== "table:cj_accounts,table:cj_point_reservations")) {
      throw new Error("CJ point ledger schema unsupported; preserve original history");
    }
    const integrity = db.prepare("PRAGMA quick_check").all();
    if (integrity.length !== 1 || integrity[0]?.quick_check !== "ok") throw new Error("CJ point ledger integrity failed");
    db.exec("PRAGMA max_page_count=4096; BEGIN IMMEDIATE"); transaction = true;
    if (fresh) db.exec(`CREATE TABLE cj_accounts (account_id TEXT PRIMARY KEY, credential_sha256 TEXT NOT NULL UNIQUE) STRICT;
      CREATE TABLE cj_point_reservations (
        id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES cj_accounts(account_id),
        cycle_id TEXT NOT NULL, day_utc TEXT NOT NULL, path TEXT NOT NULL,
        points INTEGER NOT NULL CHECK(points>0), reserved_at TEXT NOT NULL
      ) STRICT;
      PRAGMA application_id=${APP_ID}; PRAGMA user_version=1;`);
    const result = fn(db);
    db.exec("COMMIT"); transaction = false;
    syncDirectory(directory);
    return result;
  } finally { if (transaction && db.isTransaction) db.exec("ROLLBACK"); db.close(); }
}

export function reserveCjPoints(input: {
  filename: string; accountId: string; credentialSha256: string; cycleId: string;
  day: string; requestPath: string; points: number; cycleLimit: number; dailyLimit: number;
}): void {
  const id = randomUUID();
  withLedger(input.filename, db => {
    const known = db.prepare("SELECT credential_sha256 FROM cj_accounts WHERE account_id=?").get(input.accountId);
    if (known && known.credential_sha256 !== input.credentialSha256) throw new Error("CJ account credentials changed; reconcile identity before dispatch");
    if (!known) db.prepare("INSERT INTO cj_accounts VALUES (?,?)").run(input.accountId, input.credentialSha256);
    const cycleUsed = db.prepare("SELECT COALESCE(SUM(points),0) AS n FROM cj_point_reservations WHERE account_id=? AND cycle_id=?")
      .get(input.accountId, input.cycleId)?.n;
    const dayUsed = db.prepare("SELECT COALESCE(SUM(points),0) AS n FROM cj_point_reservations WHERE account_id=? AND day_utc=?")
      .get(input.accountId, input.day)?.n;
    if (typeof cycleUsed !== "number" || typeof dayUsed !== "number" ||
        cycleUsed + input.points > input.cycleLimit || dayUsed + input.points > input.dailyLimit) {
      throw new Error("CJ presale point budget exhausted; request withheld");
    }
    db.prepare("INSERT INTO cj_point_reservations VALUES (?,?,?,?,?,?,?)")
      .run(id, input.accountId, input.cycleId, input.day, input.requestPath, input.points, new Date().toISOString());
  });
  const db = new DatabaseSync(input.filename, { readOnly: true, timeout: 0, allowExtension: false });
  try {
    const row = db.prepare("SELECT account_id,points FROM cj_point_reservations WHERE id=?").get(id);
    if (row?.account_id !== input.accountId || row?.points !== input.points) throw new Error("CJ point reservation readback failed");
  } finally { db.close(); }
}
