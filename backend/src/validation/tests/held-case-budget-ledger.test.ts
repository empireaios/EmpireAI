import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { HeldCaseBudgetLedger, type HeldBudgetIdentity } from "../../runtime/held-case-budget-ledger.js";

const identity: HeldBudgetIdentity = { campaignId: "offline-test", approvalReference: "synthetic-not-owner-approval", workspaceId: "test-ws",
  serviceId: "disposable-test-service", sourceCommit: "a".repeat(40), caseSetSha256: "b".repeat(64), provider: "synthetic", model: "no-provider-call" };
function fixture(t: { after: (fn: () => void) => void }, expiryMs = 60000) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "held-budget-test-"));
  const filename = path.join(dir, "ledger.sqlite"); const ledger = new HeldCaseBudgetLedger(filename);
  const config = { identity, capMicroUsd: 100, expiresAt: new Date(Date.now() + expiryMs).toISOString() };
  ledger.createCampaign(config);
  t.after(() => {
    try { ledger.close(); } catch { /* Already closed by a restart case. */ }
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(dir).startsWith("held-budget-test-"));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return { filename, ledger, config };
}

test("campaign identity/cap/expiry are immutable and malformed money cannot authorize", t => {
  const { ledger, config } = fixture(t);
  ledger.createCampaign(config);
  for (const capMicroUsd of [101, 0, -1, Number.NaN]) assert.throws(() => ledger.createCampaign({ ...config, capMicroUsd }));
  assert.throws(() => ledger.createCampaign({ ...config, expiresAt: new Date(Date.parse(config.expiresAt) + 1000).toISOString() }), /IMMUTABLE/);
  for (const key of Object.keys(identity) as Array<keyof HeldBudgetIdentity>) assert.throws(() => ledger.reserve({ ...identity, [key]: "different" }, "attempt", 1));
  for (const amount of [-1, 0, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => ledger.reserve(identity, "attempt", amount));
  assert.equal(ledger.snapshot(identity).chargedOrReservedMicroUsd, "0");
});

test("foreign databases are refused without replacing their records", t => {
  const { filename } = fixture(t);
  const foreign = path.join(path.dirname(filename), "unrelated.sqlite");
  const original = new DatabaseSync(foreign);
  original.exec("CREATE TABLE unrelated(value TEXT); INSERT INTO unrelated VALUES('preserve me')"); original.close();
  const before = fs.readFileSync(foreign);
  assert.throws(() => new HeldCaseBudgetLedger(foreign), /FOREIGN_DATABASE_REFUSED/);
  assert.deepEqual(fs.readFileSync(foreign), before);
});

test("timeouts, retry IDs and restart retain reservations; duplicate IDs never redispatch", t => {
  const { ledger, filename } = fixture(t);
  assert.deepEqual(ledger.reserve(identity, "first-attempt", 60), { authorizedToStart: true, disposition: "NEW" });
  ledger.markUncertain(identity, "first-attempt", "TIMEOUT");
  assert.throws(() => ledger.reserve(identity, "retry-attempt", 60), /CAP_EXCEEDED/);
  ledger.close();
  const reopened = new HeldCaseBudgetLedger(filename);
  try {
    assert.equal(reopened.snapshot(identity).chargedOrReservedMicroUsd, "60");
    assert.deepEqual(reopened.reserve(identity, "first-attempt", 60), { authorizedToStart: false, disposition: "EXISTING" });
    assert.throws(() => reopened.reserve(identity, "first-attempt", 59), /ATTEMPT_CONFLICT/);
    assert.throws(() => reopened.reserve(identity, "retry-again", 60), /CAP_EXCEEDED/);
    assert.equal(reopened.snapshot(identity).attempts[0]!.state, "UNCERTAIN");
  } finally { reopened.close(); }
});

test("only final receipt releases unused reservation; conflicting settlement and overruns are visible", t => {
  const { ledger } = fixture(t);
  ledger.reserve(identity, "known", 60); ledger.markUncertain(identity, "known", "PROVIDER_ERROR");
  assert.throws(() => ledger.settleFinal(identity, "known", { actualMicroUsd: 0, receiptSha256: "c".repeat(64), finality: "TIMEOUT" as "PROVIDER_FINAL" }), /FINAL_PROVIDER_RECEIPT/);
  assert.equal(ledger.snapshot(identity).chargedOrReservedMicroUsd, "60");
  const final = { actualMicroUsd: 20, receiptSha256: "c".repeat(64), finality: "PROVIDER_FINAL" as const };
  assert.deepEqual(ledger.settleFinal(identity, "known", final), { boundExceeded: false, campaignHalted: false });
  assert.deepEqual(ledger.settleFinal(identity, "known", final), { boundExceeded: false, campaignHalted: false });
  assert.throws(() => ledger.settleFinal(identity, "known", { ...final, actualMicroUsd: 0 }), /IMMUTABLE/);
  assert.throws(() => ledger.markUncertain(identity, "known", "TIMEOUT"), /IMMUTABLE/);
  ledger.reserve(identity, "overrun", 80);
  assert.deepEqual(ledger.settleFinal(identity, "overrun", { ...final, actualMicroUsd: 81 }), { boundExceeded: true, campaignHalted: true });
  assert.equal(ledger.snapshot(identity).chargedOrReservedMicroUsd, "101");
  assert.throws(() => ledger.reserve(identity, "later", 1), /HALTED/);
  assert.equal(ledger.snapshot(identity).providerEnforcementProven, false);
});

test("expired campaign cannot reserve even with remaining balance but final reconciliation remains possible", async t => {
  const { ledger } = fixture(t, 150);
  ledger.reserve(identity, "prior", 20);
  await new Promise(resolve => setTimeout(resolve, 170));
  assert.throws(() => ledger.reserve(identity, "late", 1), /EXPIRED/);
  assert.equal(ledger.reserve(identity, "prior", 20).authorizedToStart, false);
  assert.equal(ledger.settleFinal(identity, "prior", { actualMicroUsd: 17, receiptSha256: "c".repeat(64), finality: "PROVIDER_FINAL" }).campaignHalted, false);
});

test("independent processes cannot reserve the same funds twice; committed reservation survives exit without close", async t => {
  const { ledger, filename } = fixture(t);
  const moduleUrl = new URL("../../runtime/held-case-budget-ledger.ts", import.meta.url).href;
  const childSource = `import {HeldCaseBudgetLedger} from ${JSON.stringify(moduleUrl)};
const l=new HeldCaseBudgetLedger(process.argv[1]); const identity=JSON.parse(process.argv[2]);
process.stdout.write('READY\\n'); process.stdin.once('data',()=>{try {const result=l.reserve(identity,process.argv[3],60); process.stdout.write(JSON.stringify(result)+'\\n');process.exit(0);}catch(e){process.stdout.write(JSON.stringify({error:e.message})+'\\n');process.exit(0);}});`;
  const children = ["race-a", "race-b"].map(id => {
    const child = spawn(process.execPath, [...process.execArgv.filter(x => x !== "--test"), "--input-type=module", "-e", childSource, filename, JSON.stringify(identity), id], { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let output = "", error = ""; child.stderr.on("data", b => { error += b; });
    const ready = new Promise<void>((resolve, reject) => {
      child.stdout.on("data", b => { output += b; if (output.includes("READY\n")) resolve(); });
      child.once("error", reject); child.once("exit", code => { if (!output.includes("READY\n")) reject(Error(`Child startup failed ${code}: ${error}`)); });
    });
    const finished = new Promise<void>((resolve, reject) => { child.once("exit", code => code === 0 ? resolve() : reject(Error(`Child failed ${code}: ${error}`))); child.once("error", reject); });
    return { child, ready, finished, result: () => JSON.parse(output.trim().split("\n").at(-1)!) };
  });
  const timer = setTimeout(() => { for (const c of children) c.child.kill(); }, 10000);
  try {
    await Promise.all(children.map(c => c.ready)); for (const c of children) c.child.stdin.end("go");
    await Promise.all(children.map(c => c.finished));
    const results = children.map(c => c.result());
    assert.equal(results.filter(r => r.authorizedToStart === true).length, 1);
    assert.equal(results.filter(r => r.error === "CAP_EXCEEDED").length, 1);
    assert.equal(ledger.snapshot(identity).chargedOrReservedMicroUsd, "60");
    const winner = results[0].authorizedToStart ? "race-a" : "race-b";
    assert.equal(ledger.reserve(identity, winner, 60).authorizedToStart, false);
    assert.throws(() => ledger.reserve(identity, "after-crash", 60), /CAP_EXCEEDED/);
  } finally { clearTimeout(timer); for (const c of children) if (c.child.exitCode === null) c.child.kill(); }
});
