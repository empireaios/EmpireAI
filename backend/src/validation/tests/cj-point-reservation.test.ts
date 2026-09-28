import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { closeDatabase, getDatabase } from "../../brain/database.js";
import { createCjPresalePointReservation } from "../../orchestration/pillow-commerce-presale/cj-point-reservation.js";
import { cjPointLedgerPath } from "../../orchestration/pillow-commerce-presale/cj-native-point-ledger.js";
import { CjApiClient } from "../../suppliers/cj-dropshipping/cj-api-client.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/cj-auth.js";
import type { CjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";

const execFileAsync = promisify(execFile);

test("independent CJ workers cannot both spend the same account's final points", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cj-point-processes-"));
  const primary = join(dir, "brain.sqlite");
  const moduleUrl = pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)),
    "../../orchestration/pillow-commerce-presale/cj-point-reservation.ts")).href;
  const script = `import { createCjPresalePointReservation } from ${JSON.stringify(moduleUrl)};
    const config = { apiBaseUrl: "https://cj.invalid/api2.0/v1", apiKey: "same-credential",
      apiSecret: null, integrationMode: "LIVE", requestTimeoutMs: 500, maxRetries: 0, rateLimitPerMinute: 10 };
    try { await createCjPresalePointReservation({ config, env: process.env, cycleId: "same-cycle" })("/product/list");
      console.log("ADMITTED"); } catch (e) { console.log("WITHHELD:" + e.message); }`;
  const env = { ...process.env, DATABASE_PATH: primary, CJ_PRESALE_ACCOUNT_ID: "same-account",
    CJ_PRESALE_CYCLE_POINT_LIMIT: "50", CJ_PRESALE_DAILY_POINT_LIMIT: "50" };
  try {
    const run = () => execFileAsync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script],
      { cwd: resolve(dirname(fileURLToPath(import.meta.url)), "../../.."), env, timeout: 30_000 });
    const results = await Promise.all([run(), run()]);
    assert.equal(results.filter(r => r.stdout.includes("ADMITTED")).length, 1);
    assert.equal(results.filter(r => r.stdout.includes("WITHHELD:")).length, 1);
    const db = new DatabaseSync(cjPointLedgerPath(primary), { readOnly: true });
    try { assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cj_point_reservations").get()?.n, 1); }
    finally { db.close(); }
    const third = await run();
    assert.match(third.stdout, /WITHHELD:CJ presale point budget exhausted/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("preexisting SQL.js point history blocks native-ledger reset", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cj-point-legacy-"));
  const previous = process.env.DATABASE_PATH;
  const primary = join(dir, "brain.sqlite");
  try {
    closeDatabase();
    process.env.DATABASE_PATH = primary;
    getDatabase().exec("CREATE TABLE pillow_cj_point_reservations (id TEXT PRIMARY KEY); INSERT INTO pillow_cj_point_reservations VALUES ('old-spend')");
    const config: CjConfig = { apiBaseUrl: "https://cj.invalid/api2.0/v1", apiKey: "old-key",
      apiSecret: null, integrationMode: "LIVE", requestTimeoutMs: 500, maxRetries: 0, rateLimitPerMinute: 10 };
    assert.throws(() => createCjPresalePointReservation({ config,
      env: { DATABASE_PATH: primary, CJ_PRESALE_ACCOUNT_ID: "old-account",
        CJ_PRESALE_CYCLE_POINT_LIMIT: "50", CJ_PRESALE_DAILY_POINT_LIMIT: "50" },
      cycleId: "new-cycle" }), /Legacy CJ point history/);
  } finally {
    closeDatabase();
    if (previous === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previous;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unreconciled native ledger sidecars withhold CJ point dispatch", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cj-point-sidecar-"));
  const primary = join(dir, "brain.sqlite");
  const config: CjConfig = { apiBaseUrl: "https://cj.invalid/api2.0/v1", apiKey: "sidecar-key",
    apiSecret: null, integrationMode: "LIVE", requestTimeoutMs: 500, maxRetries: 0, rateLimitPerMinute: 10 };
  const env = { DATABASE_PATH: primary, CJ_PRESALE_ACCOUNT_ID: "sidecar-account",
    CJ_PRESALE_CYCLE_POINT_LIMIT: "50", CJ_PRESALE_DAILY_POINT_LIMIT: "50" };
  try {
    await createCjPresalePointReservation({ config, env, cycleId: "cycle" })("/product/query");
    for (const suffix of ["-journal", "-wal", "-shm"]) {
      const sidecar = cjPointLedgerPath(primary) + suffix;
      writeFileSync(sidecar, "unreconciled");
      await assert.rejects(createCjPresalePointReservation({ config, env, cycleId: "cycle" })("/product/list"),
        /sidecar requires offline reconciliation/);
      rmSync(sidecar);
    }
    const db = new DatabaseSync(cjPointLedgerPath(primary), { readOnly: true });
    try { assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cj_point_reservations").get()?.n, 1); }
    finally { db.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("CJ requests need disk-backed owner budgets, reserve before dispatch, and retain uncertain charges across restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cj-point-ledger-"));
  const priorPath = process.env.DATABASE_PATH;
  const path = join(dir, "brain.sqlite");
  process.env.DATABASE_PATH = path;
  clearCjAuthCache();
  const config: CjConfig = {
    apiBaseUrl: "https://cj.invalid/api2.0/v1", apiKey: "offline-account-1",
    apiSecret: null, integrationMode: "LIVE", requestTimeoutMs: 500,
    maxRetries: 3, rateLimitPerMinute: 100,
  };
  const env = { DATABASE_PATH: path, CJ_PRESALE_ACCOUNT_ID: "offline-account-1",
    CJ_PRESALE_CYCLE_POINT_LIMIT: "60", CJ_PRESALE_DAILY_POINT_LIMIT: "100" };
  let calls = 0;
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/authentication/getAccessToken")) return Response.json({
      code: 200, result: true, data: { accessToken: "offline-token", accessTokenExpiryDate: Date.now() + 3_600_000 },
    });
    calls++;
    assert.equal(url.includes("/product/list"), true);
    const ledger = new DatabaseSync(cjPointLedgerPath(path), { readOnly: true });
    try {
      const receipt = ledger.prepare("SELECT points FROM cj_point_reservations WHERE account_id=?")
        .all("offline-account-1") as Array<{ points: number }>;
      assert.equal(receipt.length, calls);
      assert.ok(receipt.every((row) => row.points === 50));
    } finally { ledger.close(); }
    return Response.json({ code: 500, result: false, message: "uncertain" }, { status: 503 });
  };
  try {
    assert.throws(() => createCjPresalePointReservation({ config, env: { ...env, CJ_PRESALE_DAILY_POINT_LIMIT: undefined }, cycleId: "a" }), /budgets/);
    assert.throws(() => createCjPresalePointReservation({ config, env: { ...env, DATABASE_PATH: ":memory:" }, cycleId: "a" }), /disk-backed/);
    assert.throws(() => createCjPresalePointReservation({ config, env: { ...env, CJ_PRESALE_ACCOUNT_ID: undefined }, cycleId: "a" }), /stable account/);
    const client = new CjApiClient(config, fetchImpl,
      createCjPresalePointReservation({ config, env, cycleId: "a" }));
    await assert.rejects(client.listProducts({}), /uncertain/);
    assert.equal(calls, 1, "uncertain failure cannot trigger implicit point-spending retries");
    await assert.rejects(client.listProducts({}), /budget exhausted/);
    assert.equal(calls, 1);
    closeDatabase();
    const nextCycle = new CjApiClient(config, fetchImpl,
      createCjPresalePointReservation({ config, env, cycleId: "b" }));
    await assert.rejects(nextCycle.listProducts({}), /uncertain/);
    assert.equal(calls, 2);
    await assert.rejects(nextCycle.listProducts({}), /budget exhausted/);
    assert.equal(calls, 2, "UTC-day ceiling survives restart");
    const anotherAccount = createCjPresalePointReservation({
      config: { ...config, apiKey: "offline-account-2" },
      env: { ...env, CJ_PRESALE_ACCOUNT_ID: "offline-account-2" }, cycleId: "c",
    });
    await assert.rejects(anotherAccount("/unknown"), /cost unknown/);
    await anotherAccount("/product/list");
    const ledger = new DatabaseSync(cjPointLedgerPath(path), { readOnly: true });
    try { assert.equal(ledger.prepare("SELECT COUNT(*) AS n FROM cj_point_reservations").get()?.n, 3); }
    finally { ledger.close(); }
    await assert.rejects(createCjPresalePointReservation({
      config: { ...config, apiKey: "different-key" }, env, cycleId: "rotated",
    })("/product/query"), /credentials changed/);
    await assert.rejects(createCjPresalePointReservation({
      config, env: { ...env, CJ_PRESALE_ACCOUNT_ID: "alias-account" }, cycleId: "alias",
    })("/product/query"), /UNIQUE constraint failed/);
    const blocked = join(dir, "blocked.sqlite");
    mkdirSync(cjPointLedgerPath(blocked));
    const rejected = new CjApiClient(config, fetchImpl,
      createCjPresalePointReservation({ config, env: { ...env, DATABASE_PATH: blocked }, cycleId: "disk-failure" }));
    await assert.rejects(rejected.queryProduct("P1"), /bounded canonical regular file/);
    assert.equal(calls, 2, "no CJ request may leave before disk receipt");
  } finally {
    closeDatabase();
    clearCjAuthCache();
    if (priorPath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = priorPath;
    rmSync(dir, { recursive: true, force: true });
  }
});
