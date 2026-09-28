import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { BRAIN_QUEUE_NAME, TaskQueue } from "../../brain/task-queue.js";

async function until(check: () => Promise<boolean>, message: string): Promise<void> {
  for (let i = 0; i < 200; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(message);
}

test("real Redis shared Brain pause drains independent BullMQ worker and refuses overlap", async t => {
  const dir = await mkdtemp(path.join(tmpdir(), "brain-global-capture-"));
  const port = await new Promise<number>((resolve, reject) => {
    const listener = createServer(); listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      if (!address || typeof address === "string") return reject(new Error("No test port"));
      listener.close(() => resolve(address.port));
    });
  });
  const server: ChildProcess = spawn(process.env.PILLOW_TEST_REDIS_SERVER ?? "redis-server", [
    "--bind", "127.0.0.1", "--port", String(port), "--dir", dir,
    "--save", "", "--appendonly", "yes", "--appendfsync", "always",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let queue: Queue | undefined;
  let competingQueue: Queue | undefined;
  let reader: Redis | undefined;
  let worker: Worker | undefined;
  let release: (() => void) | undefined;
  t.after(async () => {
    release?.();
    await worker?.close();
    reader?.disconnect();
    await competingQueue?.close();
    await queue?.close();
    if (server.exitCode === null && server.signalCode === null) {
      const exited = new Promise<void>(resolve => server.once("exit", () => resolve()));
      server.kill("SIGKILL"); await exited;
    }
    await rm(dir, { recursive: true, force: true });
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Redis startup timed out")), 10_000);
    server.once("error", reject);
    server.once("exit", code => reject(new Error(`Redis exited ${code}: ${output.slice(-500)}`)));
    server.stdout!.on("data", chunk => {
      output += String(chunk);
      if (output.includes("Ready to accept connections")) { clearTimeout(timeout); resolve(); }
    });
  });
  const connection = { host: "127.0.0.1", port };
  queue = new Queue(BRAIN_QUEUE_NAME, { connection });
  competingQueue = new Queue(BRAIN_QUEUE_NAME, { connection });
  reader = new Redis(connection);
  const owner = Object.assign(Object.create(TaskQueue.prototype), { queue }) as TaskQueue;
  const competitor = Object.assign(Object.create(TaskQueue.prototype), { queue: competingQueue }) as TaskQueue;
  let active!: () => void;
  const activeJob = new Promise<void>(resolve => { active = resolve; });
  const workGate = new Promise<void>(resolve => { release = resolve; });
  worker = new Worker(BRAIN_QUEUE_NAME, async () => { active(); await workGate; }, { connection });
  await queue.add("capture-test", { value: 1 });
  await activeJob;
  let captured = false;
  const capture = owner.withPausedSharedProcessing(async () => {
    assert.equal(await queue.getActiveCount(), 0);
    assert.equal(await competingQueue.isPaused(), true);
    captured = true;
  }, 5000);
  await until(() => queue.isPaused(), "queue did not globally pause");
  assert.equal(captured, false);
  await assert.rejects(competitor.withPausedSharedProcessing(() => { throw new Error("overlap ran"); }), /already owned/);
  release!();
  await capture;
  assert.equal(captured, true);
  assert.equal(await queue.isPaused(), false);
  assert.equal(await reader.get(queue.toKey("capture-owner")), null);
  await assert.rejects(owner.withPausedSharedProcessing(async () => {
    await competingQueue.add("during-capture", { value: 3 });
  }), /queue changed during capture/);
  assert.equal(await queue.isPaused(), false);
  assert.equal(await reader.get(queue.toKey("capture-owner")), null);
  await queue.add("scheduled", { value: 2 }, { repeat: { every: 60_000 }, jobId: "schedule-fixture" });
  await until(async () => (await queue.getRepeatableJobs(0, 0)).length > 0, "repeat scheduler absent");
  let copiedWithScheduler = false;
  await assert.rejects(owner.withPausedSharedProcessing(() => { copiedWithScheduler = true; }), /repeat schedulers/);
  assert.equal(copiedWithScheduler, false);
  assert.equal(await queue.isPaused(), false);
});
