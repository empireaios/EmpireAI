import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Fastify from "fastify";
import { getDatabase, closeDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { certificationReceiptSchema, ingestCertificationReceipt, readCertificationReceipt } from "../../orchestration/pillow-commissioning/certification-receipt-intake.js";
import { registerCertificationReceiptRoutes } from "../../orchestration/pillow-commissioning/certification-receipt-routes.js";
import { getPillowAuthority } from "../../orchestration/pillow-commissioning/pillow-authority.js";
const fixture = (receiptId = "synthetic-engineering-fixture") => ({
  schemaVersion: 1, receiptId, syllabus: { name: "SYNTHETIC_TEST_ONLY", sha256: "a".repeat(64) },
  requirementId: "TEST-001", sourceCommit: "b".repeat(40), deploymentId: "test-deployment",
  evaluatorId: "untrusted-test-evaluator", outcome: "FAIL", observedAt: "2026-01-01T00:00:00.000Z",
  artifacts: [{ artifactId: "test-artifact", sha256: "c".repeat(64) }],
});
test("evidence intake is scoped, durable, bounded and cannot grant certification", async t => {
  const prior = process.env.DATABASE_PATH;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "receipt-intake-test-"));
  process.env.DATABASE_PATH = path.join(dir, "evidence.sqlite");
  resetDatabaseInstance();
  const authority = getPillowAuthority();
  try {
    await t.test("strict schema rejects supplied authority, duplicate artifacts and malformed identities", () => {
      assert.throws(() => certificationReceiptSchema.parse({ ...fixture(), workspaceId: "foreign" }));
      assert.throws(() => certificationReceiptSchema.parse({ ...fixture(), certificationAccepted: true }));
      assert.throws(() => certificationReceiptSchema.parse({ ...fixture(), artifacts: [...fixture().artifacts, ...fixture().artifacts] }));
      assert.throws(() => certificationReceiptSchema.parse({ ...fixture(), sourceCommit: "main" }));
    });
    await t.test("failed save is not acknowledged on insert, duplicate or readback", async () => {
      const db = getDatabase(), persist = db.requestCriticalPersist;
      db.requestCriticalPersist = async () => { throw new Error("injected disk failure"); };
      try {
        await assert.rejects(ingestCertificationReceipt("owner", "actor", fixture()), /disk failure/);
        await assert.rejects(ingestCertificationReceipt("owner", "actor", fixture()), /disk failure/);
        await assert.rejects(readCertificationReceipt("owner", fixture().receiptId), /disk failure/);
      } finally { db.requestCriticalPersist = persist; }
      const result = await ingestCertificationReceipt("owner", "actor", fixture());
      assert.equal(result.created, false);
      assert.equal(result.certificationAccepted, false);
      assert.equal(result.status, "INGESTED_UNVERIFIED");
      assert.equal(result.receipt.outcome, "FAIL");
      assert.ok(result.blockers.includes("TRUSTED_V53_MANIFEST_UNAVAILABLE"));
      assert.ok(result.blockers.includes("TRUSTED_INDEPENDENT_EVALUATOR_UNAVAILABLE"));
    });
    await t.test("delayed persistence cannot resolve ingestion early", async () => {
      const db = getDatabase(), persist = db.requestCriticalPersist;
      let release!: () => void;
      const barrier = new Promise<void>(r => { release = r; });
      db.requestCriticalPersist = async () => { await barrier; await persist.call(db); };
      let completed = false;
      try {
        const pending = ingestCertificationReceipt("owner", "actor", fixture("delayed")).then(r => { completed = true; return r; });
        await new Promise<void>(r => setImmediate(r));
        assert.equal(completed, false);
        release();
        assert.equal((await pending).certificationAccepted, false);
      } finally { release(); db.requestCriticalPersist = persist; }
    });
    await t.test("failure history, exact idempotency and workspace isolation survive database reopen", async () => {
      closeDatabase();
      assert.equal((await readCertificationReceipt("owner", fixture().receiptId))?.receipt.outcome, "FAIL");
      assert.equal(await readCertificationReceipt("foreign", fixture().receiptId), null);
      await assert.rejects(ingestCertificationReceipt("owner", "actor", { ...fixture(), outcome: "PASS" }), /different content/);
      const db = getDatabase();
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pillow_certification_intake_audit").get()?.n, 2);
      assert.equal((await readCertificationReceipt("owner", fixture().receiptId))?.receipt.outcome, "FAIL");
    });
    await t.test("audit insertion failure rolls back receipt insertion", async () => {
      const db = getDatabase();
      db.exec("CREATE TEMP TRIGGER reject_test_audit BEFORE INSERT ON pillow_certification_intake_audit WHEN NEW.receipt_id='atomic-rollback' BEGIN SELECT RAISE(ABORT, 'injected audit failure'); END;");
      try {
        await assert.rejects(ingestCertificationReceipt("owner", "actor", fixture("atomic-rollback")), /audit failure/);
        assert.equal(await readCertificationReceipt("owner", "atomic-rollback"), null);
      } finally { db.exec("DROP TRIGGER reject_test_audit"); }
    });
    await t.test("HTTP enforces authenticated roles, explicit scope and body bounds", async () => {
      const app = Fastify();
      await registerCertificationReceiptRoutes(app, { authenticate: async (request, reply) => {
        const role = request.headers["x-test-role"];
        if (!role) return reply.code(401).send({});
        request.user = { id: "test", email: "test@example.invalid", name: "test",
          role: role === "viewer" ? "viewer" : "founder",
          workspaceId: request.headers["x-test-workspace"] as string | undefined } as typeof request.user;
      } });
      const url = "/pillow-commissioning/certification/receipts";
      try {
        assert.equal((await app.inject({ method: "POST", url, payload: fixture() })).statusCode, 401);
        assert.equal((await app.inject({ method: "POST", url, headers: { "x-test-role": "viewer", "x-test-workspace": "owner" }, payload: fixture() })).statusCode, 403);
        assert.equal((await app.inject({ method: "POST", url, headers: { "x-test-role": "founder" }, payload: fixture() })).statusCode, 403);
        const headers = { "x-test-role": "founder", "x-test-workspace": "owner" };
        assert.equal((await app.inject({ method: "POST", url, headers, payload: { ...fixture(), outcome: "PASS" } })).statusCode, 409);
        assert.equal((await app.inject({ method: "POST", url, headers, payload: { ...fixture(), extra: true } })).statusCode, 400);
        assert.equal((await app.inject({ method: "POST", url, headers, payload: { ...fixture(), extra: "x".repeat(20000) } })).statusCode, 413);
        assert.equal((await app.inject({ url: url + "/" + fixture().receiptId, headers: { ...headers, "x-test-workspace": "foreign" } })).statusCode, 404);
        assert.equal((await app.inject({ method: "POST", url, headers, payload: fixture() })).statusCode, 200);
      } finally { await app.close(); }
    });
    await t.test("durable readbacks and identical retries do not export the entire database again", async () => {
      const db = getDatabase(), persist = db.requestCriticalPersist;
      db.requestCriticalPersist = async () => { throw new Error("unnecessary export"); };
      try {
        assert.equal((await readCertificationReceipt("owner", fixture().receiptId))?.receipt.outcome, "FAIL");
        assert.equal((await ingestCertificationReceipt("owner", "actor", fixture())).created, false);
      } finally { db.requestCriticalPersist = persist; }
    });
    await t.test("nonpersistent configuration cannot ingest evidence", async () => {
      const current = process.env.DATABASE_PATH;
      process.env.DATABASE_PATH = ":memory:";
      try { await assert.rejects(ingestCertificationReceipt("owner", "actor", fixture("memory")), /Persistent evidence database/); }
      finally { process.env.DATABASE_PATH = current; }
    });
    await t.test("missing audit cannot be exposed through reads or retries", async () => {
      await ingestCertificationReceipt("owner", "actor", fixture("audit-corrupt"));
      getDatabase().prepare("DELETE FROM pillow_certification_intake_audit WHERE receipt_id=@id").run({ id: "audit-corrupt" });
      await assert.rejects(readCertificationReceipt("owner", "audit-corrupt"), /audit integrity/);
      await assert.rejects(ingestCertificationReceipt("owner", "actor", fixture("audit-corrupt")), /audit integrity/);
    });
    assert.deepEqual(getPillowAuthority(), authority);
    assert.equal(authority.birthStatus, "NOT_BORN");
    assert.equal(authority.realCommerceAuthorized, false);
  } finally {
    resetDatabaseInstance();
    if (prior === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = prior;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
