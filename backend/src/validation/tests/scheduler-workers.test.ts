import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GuardianBlockedError } from "../../guardian/guardian-engine.js";
import {
  configureValidationEnvironment,
  createValidationBrain,
  isRedisAvailable,
  teardownBrain,
} from "../harness.js";

configureValidationEnvironment();

describe("Scheduler and workers validation", () => {
  it("Scheduler: registers valid repeat job and writes audit entry", async () => {
    const brain = await createValidationBrain();
    try {
      if (!(await isRedisAvailable(brain.redis))) {
        console.warn("[skip] Redis unavailable — skipping scheduler checks");
        return;
      }

      await brain.scheduler.register({
        name: "validation-probe",
        cron: "0 0 1 1 *",
        payload: {
          type: "tool.execute",
          workspaceId: "ws_validation",
          toolName: "portfolio.get_summary",
          input: { workspaceId: "ws_validation" },
          correlationId: "validation-scheduler-ok",
          priority: "low",
        },
      });

      const auditRows = brain.auditLogger.query({
        workspaceId: "ws_validation",
        correlationId: "validation-scheduler-ok",
        limit: 1,
      });

      assert.equal(auditRows.length, 1);
      assert.equal(auditRows[0]?.action, "scheduler.schedule");
    } finally {
      await teardownBrain(brain);
    }
  });

  it("Background workers: start and stop without crash", async () => {
    const brain = await createValidationBrain({ startWorkers: true });
    try {
      if (!(await isRedisAvailable(brain.redis))) {
        console.warn("[skip] Redis unavailable — skipping worker pool checks");
        return;
      }

      assert.ok(brain.workerPool.isActive(), "Worker pool should be active");
    } finally {
      await teardownBrain(brain);
    }
  });
});

describe("Guardian integration validation", () => {
  it("Orchestrator throws GuardianBlockedError for blocked dispatches", async () => {
    const brain = await createValidationBrain();
    try {
      if (!(await isRedisAvailable(brain.redis))) {
        console.warn("[skip] Redis unavailable — skipping Guardian integration");
        return;
      }

      await assert.rejects(
        () =>
          brain.orchestrator.dispatch({
            module: "ads",
            action: "optimize",
            workspaceId: "ws_validation",
            payload: {},
          }),
        (error: unknown) => error instanceof GuardianBlockedError,
      );
    } finally {
      await teardownBrain(brain);
    }
  });

  it("LLM Layer: complete fails safely when no providers configured", async () => {
    const brain = await createValidationBrain();
    try {
      const available = brain.llmRouter.listAvailable();
      if (available.length > 0) {
        console.warn("[skip] LLM provider configured — skipping no-provider failure test");
        return;
      }

      await assert.rejects(
        () =>
          brain.llmRouter.complete({
            workspaceId: "ws_validation",
            correlationId: "validation-llm-fail",
            messages: [{ role: "user", content: "probe" }],
          }),
        /No LLM providers configured/,
      );
    } finally {
      await teardownBrain(brain);
    }
  });
});
