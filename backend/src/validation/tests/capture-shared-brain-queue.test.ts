import assert from "node:assert/strict";
import { test } from "node:test";
import { TaskQueue } from "../../brain/task-queue.js";

function fixture() {
  const keys = new Map<string, string>();
  let paused = false;
  let active = 1;
  let lastEvent = "1-0";
  const client = {
    set: async (key: string, value: string) => keys.has(key) ? null : (keys.set(key, value), "OK"),
    get: async (key: string) => keys.get(key) ?? null,
    eval: async (_script: string, _count: number, key: string, owner: string) =>
      keys.get(key) === owner ? (keys.delete(key), 1) : 0,
    xrevrange: async () => [[lastEvent, []]],
  };
  const queue = {
    client: Promise.resolve(client), toKey: (suffix: string) => `bull:brain:${suffix}`,
    isPaused: async () => paused,
    pause: async () => { paused = true; },
    resume: async () => { paused = false; },
    getActiveCount: async () => active,
    getJobCounts: async () => ({ waiting: 0, paused: 0, delayed: 0, prioritized: 0, active }),
    getRepeatableJobs: async (): Promise<Array<{ key: string }>> => [],
    getJobSchedulersCount: async () => 0,
  };
  const task = Object.create(TaskQueue.prototype) as TaskQueue;
  Object.assign(task, { queue });
  return { task, queue, keys, setActive: (n: number) => { active = n; }, setPaused: (v: boolean) => { paused = v; }, changeEvent: () => { lastEvent = "2-0"; } };
}

test("shared Brain queue refuses overlapping capture and drains other consumers before callback", async () => {
  const f = fixture();
  let captured = false;
  const first = f.task.withPausedSharedProcessing(() => { captured = true; return 7; });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(await f.queue.isPaused(), true);
  assert.equal(captured, false);
  await assert.rejects(f.task.withPausedSharedProcessing(() => 8), /already owned/);
  f.setActive(0);
  assert.equal(await first, 7);
  assert.equal(await f.queue.isPaused(), false);
  assert.equal(f.keys.size, 0);
});

test("registered repeat producers refuse shared capture and restore queue", async () => {
  const f = fixture();
  f.setActive(0);
  f.queue.getRepeatableJobs = async () => [{ key: "scheduled-job" }];
  let invoked = false;
  await assert.rejects(f.task.withPausedSharedProcessing(() => { invoked = true; }), /repeat schedulers/);
  assert.equal(invoked, false);
  assert.equal(await f.queue.isPaused(), false);
  assert.equal(f.keys.size, 0);
});

test("a producer event during callback invalidates capture even when queue is still paused", async () => {
  const f = fixture();
  f.setActive(0);
  await assert.rejects(f.task.withPausedSharedProcessing(() => { f.changeEvent(); }), /queue changed/);
  assert.equal(await f.queue.isPaused(), false);
  assert.equal(f.keys.size, 0);
});

test("cooperating task and repeat producers refuse while capture owns queue", async () => {
  const f = fixture();
  f.setActive(0);
  await f.task.withPausedSharedProcessing(async () => {
    await assert.rejects(f.task.enqueue({ type: "noop" } as never), /production withheld/);
    await assert.rejects(f.task.registerScheduledJob({ name: "repeat", cron: "* * * * *", payload: {} as never }), /production withheld/);
  });
  assert.equal(f.keys.size, 0);
});

test("shared queue releases its pause on timeout and callback failure; preexisting pause stays untouched", async () => {
  const f = fixture();
  await assert.rejects(f.task.withPausedSharedProcessing(() => 1, 5), /did not drain/);
  assert.equal(await f.queue.isPaused(), false);
  assert.equal(f.keys.size, 0);
  f.setActive(0);
  await assert.rejects(f.task.withPausedSharedProcessing(() => { throw new Error("copy failed"); }), /copy failed/);
  assert.equal(await f.queue.isPaused(), false);
  f.setPaused(true);
  await assert.rejects(f.task.withPausedSharedProcessing(() => 1), /already paused/);
  assert.equal(await f.queue.isPaused(), true);
  assert.equal(f.keys.size, 0);
});

test("lost capture ownership refuses snapshot and never resumes another owner's queue", async () => {
  const f = fixture();
  f.setActive(0);
  let captured = false;
  const original = f.queue.getActiveCount;
  f.queue.getActiveCount = async () => {
    f.keys.set("bull:brain:capture-owner", "another-owner");
    return original();
  };
  await assert.rejects(f.task.withPausedSharedProcessing(() => { captured = true; }), /restoration uncertain/);
  assert.equal(captured, false);
  assert.equal(await f.queue.isPaused(), true);
  assert.equal(f.keys.get("bull:brain:capture-owner"), "another-owner");
});
