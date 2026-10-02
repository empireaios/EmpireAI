import assert from "node:assert/strict";
import { test } from "node:test";
import { BrainWorkerPool } from "../../brain/workers/worker-pool.js";

test("candidate local Brain worker drains before capture and resumes after error", async () => {
  let drain!: () => void;
  let enters = 0;
  let resumes = 0;
  const waiting = new Promise<void>(resolve => { drain = resolve; });
  const fake = { pause: async () => { enters++; await waiting; }, resume: () => { resumes++; } };
  const pool = new BrainWorkerPool(null, {} as never);
  (pool as unknown as { worker: typeof fake }).worker = fake;
  let captured = false;
  const snapshot = pool.withPausedProcessing(() => { captured = true; return "captured"; });
  await Promise.resolve();
  assert.equal(enters, 1);
  assert.equal(captured, false);
  await assert.rejects(pool.withPausedProcessing(() => "other"), /unavailable/);
  drain();
  assert.equal(await snapshot, "captured");
  assert.equal(resumes, 1);
  await assert.rejects(pool.withPausedProcessing(() => { throw new Error("copy refused"); }), /copy refused/);
  assert.equal(resumes, 2);
});

test("a timed-out local worker drain cannot permit another capture before the worker settles", async () => {
  let drain!: () => void;
  const waiting = new Promise<void>(resolve => { drain = resolve; });
  let resumes = 0;
  const fake = { pause: () => waiting, resume: () => { resumes++; } };
  const pool = new BrainWorkerPool(null, {} as never);
  (pool as unknown as { worker: typeof fake }).worker = fake;
  let captured = false;
  await assert.rejects(pool.withPausedProcessing(() => { captured = true; }, 10), /timed out/);
  assert.equal(captured, false);
  await assert.rejects(pool.withPausedProcessing(() => { captured = true; }), /unavailable/);
  drain();
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(resumes, 1);
  assert.equal(await pool.withPausedProcessing(() => "later"), "later");
});
