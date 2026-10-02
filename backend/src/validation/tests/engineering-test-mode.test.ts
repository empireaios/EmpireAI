import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { backgroundExecutionPolicy, isEngineeringTestMode } from "../../runtime/engineering-test-mode.js";
import { ManagedBackgroundTask } from "../../runtime/managed-background-task.js";
import {
  getPillowCommercePresaleSchedulerDefinitions,
  PillowCommercePresaleAutomationServer,
  runPillowCommercePresaleAutomationTick,
} from "../../orchestration/pillow-commerce-presale/automation/pillow-commerce-presale-automation.js";
import {
  getPillowExecutiveLoopSchedulerDefinitions,
  PillowExecutiveLoopAutomationServer,
  runPillowExecutiveLoopAutomationTick,
} from "../../orchestration/pillow-commissioning/executive-operating-loop/automation.js";
import { runPillowCommercePresaleCycle } from "../../orchestration/pillow-commerce-presale/services/presale-cycle-service.js";
import { runExecutiveOperatingCycle } from "../../orchestration/pillow-commissioning/executive-operating-loop/cycle-runner.js";
import { ensurePillowHostReady, resetPillowBootState } from "../../orchestration/pillow-host/pillow-boot.js";

const previousMode = process.env.EMPIRE_ENGINEERING_TEST_MODE;
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
afterEach(() => {
  if (previousMode == null) delete process.env.EMPIRE_ENGINEERING_TEST_MODE;
  else process.env.EMPIRE_ENGINEERING_TEST_MODE = previousMode;
});

describe("Bounded engineering deployment mode", () => {
  it("refuses malformed configuration rather than accidentally enabling commerce", () => {
    assert.throws(() => isEngineeringTestMode({ EMPIRE_ENGINEERING_TEST_MODE: "treu" }), /must be/);
    assert.equal(isEngineeringTestMode({ EMPIRE_ENGINEERING_TEST_MODE: "true" }), true);
    assert.equal(isEngineeringTestMode({}), false);
  });

  it("suppresses generic queue consumers and all commerce repeat definitions", () => {
    process.env.EMPIRE_ENGINEERING_TEST_MODE = "true";
    assert.deepEqual(backgroundExecutionPolicy({ startWorkers: true, startScheduler: true }), {
      startWorkers: false, startScheduler: false, commerceAutomation: false,
    });
    assert.deepEqual(getPillowCommercePresaleSchedulerDefinitions(), []);
    assert.deepEqual(getPillowExecutiveLoopSchedulerDefinitions(), []);
  });

  it("blocks direct commerce ticks and service calls before storage or network access", async () => {
    process.env.EMPIRE_ENGINEERING_TEST_MODE = "true";
    for (const result of await Promise.all([
      runPillowCommercePresaleAutomationTick(), runPillowExecutiveLoopAutomationTick(),
    ])) {
      assert.equal(result.ok, false);
      assert.match(result.detail, /Engineering test mode/);
    }
    await assert.rejects(() => runPillowCommercePresaleCycle({
      workspaceId: "never-created", companyId: "never-created", initiatedBy: "pillow-autonomous",
      fetchImpl: async () => { throw new Error("Commerce network must not be called"); },
    }), /Commerce automation is disabled/);
    assert.throws(() => runExecutiveOperatingCycle({
      workspaceId: "never-created", mode: "live",
      get situation(): never { throw new Error("Situation must not be read"); },
    }), /Commerce automation is disabled/);
  });

  for (const [label, Server] of [
    ["presale", PillowCommercePresaleAutomationServer],
    ["executive", PillowExecutiveLoopAutomationServer],
  ] as const) {
    it(`${label}: engineering mode never starts the background commerce task`, async (t) => {
      process.env.EMPIRE_ENGINEERING_TEST_MODE = "true";
      t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
      let calls = 0;
      const server = new Server(async () => { calls += 1; return { ok: true, detail: "sentinel" }; });
      server.start();
      t.mock.timers.tick(24 * 60 * 60 * 1000);
      await flush();
      await server.stop();
      assert.equal(calls, 0);
    });

    it(`${label}: stopping before boot cancels both boot and recurring callbacks`, async (t) => {
      process.env.EMPIRE_ENGINEERING_TEST_MODE = "false";
      t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
      let calls = 0;
      const server = new Server(async () => { calls += 1; return { ok: true, detail: "sentinel" }; });
      server.start();
      await server.stop();
      t.mock.timers.tick(24 * 60 * 60 * 1000);
      await flush();
      assert.equal(calls, 0);
    });

    it(`${label}: shutdown drains an in-flight tick and prevents overlapping ticks`, async (t) => {
      process.env.EMPIRE_ENGINEERING_TEST_MODE = "false";
      t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
      let calls = 0;
      let finish!: () => void;
      const pending = new Promise<void>((resolve) => { finish = resolve; });
      const server = new Server(async () => {
        calls += 1; await pending; return { ok: true, detail: "settled" };
      });
      server.start();
      t.mock.timers.tick(300_000);
      await flush();
      assert.equal(calls, 1);
      t.mock.timers.tick(24 * 60 * 60 * 1000);
      await flush();
      assert.equal(calls, 1);
      let stopped = false;
      const stopping = server.stop().then(() => { stopped = true; });
      await flush();
      assert.equal(stopped, false, "database persistence must wait for the active task");
      finish();
      await stopping;
      t.mock.timers.tick(24 * 60 * 60 * 1000);
      await flush();
      assert.equal(calls, 1);
    });
  }

  it("cancels a boot callback even if its timer fired just before shutdown", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
    let boots = 0;
    const task = new ManagedBackgroundTask({ run: () => { boots += 1; }, onError: (error) => { throw error; } });
    task.start(5_000);
    t.mock.timers.tick(5_000);
    await task.stop();
    await flush();
    assert.equal(boots, 0);
  });

  it("drains delayed Pillow boot and can be restarted after a fully stopped generation", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
    let boots = 0;
    const task = new ManagedBackgroundTask({ run: () => { boots += 1; }, onError: (error) => { throw error; } });
    task.start(5_000);
    await task.stop();
    task.start(5_000);
    t.mock.timers.tick(5_000);
    await flush();
    await task.stop();
    assert.equal(boots, 1);
  });

  it("clears the readiness timeout when an already-starting Pillow host completes", async (t) => {
    resetPillowBootState();
    const scheduled = t.mock.method(globalThis, "setTimeout");
    const cleared = t.mock.method(globalThis, "clearTimeout");
    let reads = 0;
    const host = {
      getStatus: () => ({ lifecycle: ++reads <= 2 ? "starting" : "running", lastError: null }),
    } as unknown as Parameters<typeof ensurePillowHostReady>[0];
    const result = await ensurePillowHostReady(
      host,
      {} as Parameters<typeof ensurePillowHostReady>[1],
      {} as Parameters<typeof ensurePillowHostReady>[2],
    );
    assert.equal(result.ready, true);
    assert.equal(scheduled.mock.callCount(), 1);
    const timer = scheduled.mock.calls[0]!.result;
    // Clean up even if this assertion fails against an older implementation.
    clearTimeout(timer);
    assert.ok(cleared.mock.calls.slice(0, -1).some((call) => call.arguments[0] === timer));
  });
});
