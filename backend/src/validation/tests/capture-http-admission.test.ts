import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { installCaptureHttpAdmission } from "../../runtime/capture-http-admission.js";

test("HTTP capture gate drains admitted requests, refuses later reads and writes, then reopens", async t => {
  const app = Fastify(); t.after(() => app.close());
  const gate = installCaptureHttpAdmission(app);
  let entered!: () => void;
  let finish!: () => void;
  const admitted = new Promise<void>(resolve => { entered = resolve; });
  const wait = new Promise<void>(resolve => { finish = resolve; });
  t.after(() => finish());
  app.get("/slow", async () => { entered(); await wait; return { ok: true }; });
  app.post("/write", async () => ({ accepted: true }));
  app.get("/health/live", async () => ({ live: true }));
  const pending = app.inject("/slow");
  await admitted;
  let captureEntered = false;
  const snapshot = gate.withDrainedAdmission(async () => { captureEntered = true; return "captured"; });
  assert.equal((await app.inject({ method: "POST", url: "/write" })).statusCode, 503);
  assert.equal((await app.inject("/slow")).statusCode, 503);
  assert.equal((await app.inject("/health/live")).statusCode, 200);
  assert.equal(captureEntered, false, "capture waits for admitted request completion");
  finish();
  assert.equal((await pending).statusCode, 200);
  assert.equal(await snapshot, "captured");
  assert.equal((await app.inject({ method: "POST", url: "/write" })).statusCode, 200);
  await assert.rejects(gate.withDrainedAdmission(() => { throw new Error("copy refused"); }), /copy refused/);
  assert.equal((await app.inject({ method: "POST", url: "/write" })).statusCode, 200);
});

test("timed-out HTTP drain never enters snapshot and reopens admission", async () => {
  const gate = installCaptureHttpAdmission(Fastify());
  const release = gate.admit();
  let captured = false;
  await assert.rejects(gate.withDrainedAdmission(() => { captured = true; }, 10), /timed out/);
  assert.equal(captured, false);
  release();
  const later = gate.admit(); later();
});
