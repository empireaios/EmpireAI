import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { closeDatabase, getDatabase } from "../../brain/database.js";
import { createCjPresalePointReservation } from "../../orchestration/pillow-commerce-presale/cj-point-reservation.js";
import { CjApiClient } from "../../suppliers/cj-dropshipping/cj-api-client.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/cj-auth.js";
import type { CjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";

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
  const env = { DATABASE_PATH: path, CJ_PRESALE_CYCLE_POINT_LIMIT: "60", CJ_PRESALE_DAILY_POINT_LIMIT: "100" };
  let calls = 0;
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/authentication/getAccessToken")) return Response.json({
      code: 200, result: true, data: { accessToken: "offline-token", accessTokenExpiryDate: Date.now() + 3_600_000 },
    });
    calls++;
    assert.equal(url.includes("/product/list"), true);
    const receipt = getDatabase().prepare("SELECT points FROM pillow_cj_point_reservations")
      .all() as Array<{ points: number }>;
    assert.equal(receipt.length, calls);
    assert.ok(receipt.every((row) => row.points === 50));
    return Response.json({ code: 500, result: false, message: "uncertain" }, { status: 503 });
  };
  try {
    assert.throws(() => createCjPresalePointReservation({ config, env: { ...env, CJ_PRESALE_DAILY_POINT_LIMIT: undefined }, cycleId: "a" }), /budgets/);
    assert.throws(() => createCjPresalePointReservation({ config, env: { ...env, DATABASE_PATH: ":memory:" }, cycleId: "a" }), /disk-backed/);
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
      config: { ...config, apiKey: "offline-account-2" }, env, cycleId: "c",
    });
    await assert.rejects(anotherAccount("/unknown"), /cost unknown/);
    await anotherAccount("/product/list");
    const rows = getDatabase().prepare("SELECT COUNT(*) AS n FROM pillow_cj_point_reservations")
      .get() as { n: number };
    assert.equal(rows.n, 3);
    const db = getDatabase();
    const originalPersist = db.requestCriticalPersist;
    db.requestCriticalPersist = async () => { throw new Error("simulated disk failure"); };
    try {
      const secondConfig = { ...config, apiKey: "offline-account-2" };
      const rejected = new CjApiClient(secondConfig, fetchImpl,
        createCjPresalePointReservation({ config: secondConfig, env, cycleId: "disk-failure" }));
      await assert.rejects(rejected.queryProduct("P1"), /simulated disk failure/);
      assert.equal(calls, 2, "no CJ request may leave before disk receipt");
    } finally {
      db.requestCriticalPersist = originalPersist;
    }
  } finally {
    closeDatabase();
    clearCjAuthCache();
    if (priorPath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = priorPath;
    rmSync(dir, { recursive: true, force: true });
  }
});
