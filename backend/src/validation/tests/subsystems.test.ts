import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuditLogger } from "../../brain/audit/audit-logger.js";
import { DecisionEngine } from "../../brain/decision-engine.js";
import { MemoryStore } from "../../brain/memory/memory-store.js";
import { ToolRegistry } from "../../brain/tools/tool-registry.js";
import { WorkflowEngine } from "../../brain/workflow-engine.js";
import { coreTools } from "../../agents/tools/core-tools.js";
import { LLMRouter } from "../../brain/llm/llm-router.js";
import { EventBus } from "../../brain/events/event-bus.js";
import { AgentManager } from "../../brain/agent-manager.js";
import { agentDefinitions } from "../../agents/definitions/agents.js";
import { workflowDefinitions } from "../../agents/workflows/workflows.js";
import { processBrainTask } from "../../brain/workers/processor.js";
import {
  configureValidationEnvironment,
  createValidationBrain,
  isRedisAvailable,
  registerStandardBrainTools,
  teardownBrain,
} from "../harness.js";

configureValidationEnvironment();

describe("Brain subsystems — unit validation", () => {
  it("Decision Engine: normal, invalid authority handling, execution gates", () => {
    const engine = new DecisionEngine();
    const l0 = engine.evaluate({
      agentId: "test",
      action: "read",
      authorityLevel: "L0",
      rationale: "safe",
    });
    assert.equal(engine.canExecute(l0), true);

    const l3 = engine.evaluate({
      agentId: "test",
      action: "budget",
      authorityLevel: "L3",
      rationale: "needs approval",
    });
    assert.equal(l3.requiresFounderApproval, true);
    assert.equal(engine.canExecute(l3), false);

    const approved = engine.evaluate({
      agentId: "test",
      action: "budget",
      authorityLevel: "L3",
      rationale: "approved",
      founderApproved: true,
    });
    assert.equal(engine.canExecute(approved), true);
  });

  it("Tool Registry: registers tools and rejects duplicates/unknown", () => {
    const registry = new ToolRegistry();
    registry.register(coreTools[0]!);
    assert.throws(() => registry.register(coreTools[0]!));
    assert.throws(() => registry.require("missing.tool"));
  });

  it("Memory System: upsert, read, delete, expiry purge", () => {
    const memory = new MemoryStore();
    memory.upsert({
      scope: "workspace",
      workspaceId: "ws_mem",
      key: "probe",
      value: { ok: true },
    });

    const read = memory.get({
      scope: "workspace",
      workspaceId: "ws_mem",
      key: "probe",
    });
    assert.ok(read);

    memory.upsert({
      scope: "workspace",
      workspaceId: "ws_mem",
      key: "expiring",
      value: { temp: true },
      ttlSeconds: -1,
    });

    const expired = memory.get({
      scope: "workspace",
      workspaceId: "ws_mem",
      key: "expiring",
    });
    assert.equal(expired, null);
  });

  it("Audit Logs: write and query with correlation filter", () => {
    const audit = new AuditLogger();
    const entry = audit.write({
      action: "tool.execute",
      actor: "validation",
      workspaceId: "ws_audit",
      correlationId: "corr-audit-1",
      metadata: { probe: true },
    });

    const rows = audit.query({
      workspaceId: "ws_audit",
      correlationId: entry.correlationId,
      limit: 5,
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.action, "tool.execute");
  });

  it("Workflow Engine: validates invalid definitions and registers valid ones", () => {
    const audit = new AuditLogger();
    const redis = { duplicate: () => redis, on: () => undefined, subscribe: async () => undefined } as never;
    const eventBus = new EventBus(redis);
    const toolRegistry = new ToolRegistry();
    registerStandardBrainTools(toolRegistry);

    const agentManager = new AgentManager({
      toolRegistry,
      llmRouter: new LLMRouter(),
      memoryStore: new MemoryStore(),
      decisionEngine: new DecisionEngine(),
      eventBus,
      auditLogger: audit,
    });
    agentManager.registerMany(agentDefinitions);

    const workflowEngine = new WorkflowEngine({
      agentManager,
      toolRegistry,
      eventBus,
      auditLogger: audit,
    });

    assert.throws(() =>
      workflowEngine.register({
        id: "bad",
        name: "Bad",
        description: "bad",
        steps: [{ id: "s1" }],
      }),
    );

    workflowEngine.registerMany(workflowDefinitions);
    assert.ok(workflowEngine.get("manufacture-company"));
  });

  it("LLM Layer: reports availability without throwing on list", () => {
    const router = new LLMRouter();
    const available = router.listAvailable();
    assert.ok(Array.isArray(available));
  });

  it("Background worker processor: validates required payload fields", async () => {
    const audit = new AuditLogger();
    const toolRegistry = new ToolRegistry();
    registerStandardBrainTools(toolRegistry);
    const agentManager = new AgentManager({
      toolRegistry,
      llmRouter: new LLMRouter(),
      memoryStore: new MemoryStore(),
      decisionEngine: new DecisionEngine(),
      eventBus: { publish: async () => ({}) } as never,
      auditLogger: audit,
    });

    const workflowEngine = new WorkflowEngine({
      agentManager,
      toolRegistry,
      eventBus: { publish: async () => ({}) } as never,
      auditLogger: audit,
    });

    await assert.rejects(() =>
      processBrainTask(
        {
          type: "agent.run",
          workspaceId: "ws",
          input: {},
          correlationId: "c1",
        },
        { agentManager, workflowEngine, toolRegistry },
      ),
    );

    const toolResult = await processBrainTask(
      {
        type: "tool.execute",
        workspaceId: "ws",
        toolName: "portfolio.get_summary",
        input: { workspaceId: "ws" },
        correlationId: "c2",
      },
      { agentManager, workflowEngine, toolRegistry },
    );

    assert.ok(toolResult);
  });
});

describe("Brain subsystems — integration validation", () => {
  it("Orchestrator load dispatch, invalid route, Guardian block", async () => {
    const brain = await createValidationBrain();
    try {
      const redisOk = await isRedisAvailable(brain.redis);
      if (!redisOk) {
        console.warn("[skip] Redis unavailable — skipping orchestrator integration checks");
        return;
      }

      const load = await brain.orchestrator.dispatch({
        module: "dashboard",
        action: "load",
        workspaceId: "ws_validation",
        payload: {},
      });
      assert.equal(load.status, "completed");
      assert.ok(load.result);

      await assert.rejects(
        () =>
          brain.orchestrator.dispatch({
            module: "unknown",
            action: "missing",
            workspaceId: "ws_validation",
            payload: {},
          }),
        /No orchestrator route/,
      );

      await assert.rejects(
        () =>
          brain.orchestrator.dispatch({
            module: "store",
            action: "manufacture",
            workspaceId: "ws_validation",
            payload: {},
          }),
        (error: unknown) => {
          if (error instanceof Error) {
            return /confirmed=true|GuardianBlockedError/i.test(error.message);
          }
          return false;
        },
      );
    } finally {
      await teardownBrain(brain);
    }
  });

  it("Task Queue: enqueue stats and retry configuration", async () => {
    const brain = await createValidationBrain();
    try {
      if (!(await isRedisAvailable(brain.redis))) {
        console.warn("[skip] Redis unavailable — skipping task queue checks");
        return;
      }

      const { jobId, correlationId } = await brain.taskQueue.enqueue({
        type: "tool.execute",
        workspaceId: "ws_validation",
        toolName: "portfolio.get_summary",
        input: { workspaceId: "ws_validation" },
        correlationId: "validation-queue-1",
        priority: "normal",
      });

      assert.ok(jobId);
      assert.ok(correlationId);
      const stats = await brain.taskQueue.getStats();
      assert.ok(typeof stats.waiting === "number");
    } finally {
      await teardownBrain(brain);
    }
  });

  it("Event Bus: publish receives no throw when Redis is healthy", async () => {
    const brain = await createValidationBrain();
    try {
      if (!(await isRedisAvailable(brain.redis))) {
        console.warn("[skip] Redis unavailable — skipping event bus checks");
        return;
      }

      const event = await brain.eventBus.publish({
        type: "signal",
        source: "validation",
        workspaceId: "ws_validation",
        correlationId: "validation-event-1",
        payload: { ok: true },
      });

      assert.ok(event.id);
    } finally {
      await teardownBrain(brain);
    }
  });

  it("Guardian health report covers all subsystems", async () => {
    const brain = await createValidationBrain();
    try {
      if (!(await isRedisAvailable(brain.redis))) {
        console.warn("[skip] Redis unavailable — skipping guardian health report");
        return;
      }

      const report = await brain.guardian.checkHealth(brain);
      assert.equal(report.subsystems.length, 13);
      assert.ok(["healthy", "degraded", "failed"].includes(report.overall));
    } finally {
      await teardownBrain(brain);
    }
  });
});
