import assert from "node:assert/strict";
import { test } from "node:test";
import { ManagedBackgroundTask } from "../../runtime/managed-background-task.js";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const tick = (task: ManagedBackgroundTask) =>
  (task as unknown as { tick: () => void }).tick();

test("Pillow boot is drained and a delayed boot is held through capture", async t => {
  let finish!: () => void;
  let entered!: () => void;
  const first = new Promise<void>(resolve => { finish = resolve; });
  const started = new Promise<void>(resolve => { entered = resolve; });
  let runs = 0;
  const task = new ManagedBackgroundTask({
    run: async () => { runs++; entered(); if (runs === 1) await first; },
    onError: error => { throw error; },
  });
  t.after(async () => { finish(); await task.stop(); });
  task.start(60_000);
  tick(task);
  await started;
  let captureEntered = false;
  let endCapture!: () => void;
  const captured = new Promise<void>(resolve => { endCapture = resolve; });
  const capture = task.withPausedExecution(async () => {
    captureEntered = true;
    await captured;
    return "saved";
  });
  tick(task); // a delayed boot or interval firing while capture is pending
  await flush();
  assert.equal(captureEntered, false);
  assert.equal(runs, 1);
  finish();
  await flush();
  assert.equal(captureEntered, true);
  assert.equal(runs, 1);
  endCapture();
  assert.equal(await capture, "saved");
  await flush();
  assert.equal(runs, 2, "a delayed boot is resumed after the snapshot");
});

test("timed-out Pillow drain cannot start another capture or boot while work remains active", async t => {
  let finish!: () => void;
  const first = new Promise<void>(resolve => { finish = resolve; });
  let runs = 0;
  const task = new ManagedBackgroundTask({
    run: async () => { runs++; if (runs === 1) await first; },
    onError: error => { throw error; },
  });
  t.after(async () => { finish(); await task.stop(); });
  task.start(60_000);
  tick(task);
  await flush();
  let captured = false;
  await assert.rejects(task.withPausedExecution(() => { captured = true; }, 10), /timed out/);
  tick(task);
  assert.equal(runs, 1);
  assert.equal(captured, false);
  await assert.rejects(task.withPausedExecution(() => "other"), /unavailable/);
  finish();
  await flush();
  assert.equal(runs, 2);
  assert.equal(await task.withPausedExecution(() => "recovered"), "recovered");
});
