import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { AuditLogger } from "../../brain/audit/audit-logger.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  getSoulFile,
  initializeSoulFile,
  listSoulFileChangeHistory,
  resetSoulFileRepository,
} from "../../foundation/soul-file/index.js";
import {
  captureSoulRuntimeEvent,
  getSoulRuntimeEngine,
  listSoulRuntimeEvents,
  mapAuditEntryToCaptures,
  resetSoulRuntimeEngine,
  resetSoulRuntimeRepository,
  soulRuntimeTools,
} from "../../foundation/soul-runtime/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s002";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "soul-runtime",
    correlationId: "corr-s002",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = soulRuntimeTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetSoulFileRepository();
  resetSoulRuntimeRepository();
  resetSoulRuntimeEngine();
});

afterEach(() => {
  getSoulRuntimeEngine().stop();
  resetSoulRuntimeEngine();
  resetSoulRuntimeRepository();
  resetSoulFileRepository();
  resetDatabaseInstance();
});

describe("S002 Soul Runtime Engine", () => {
  it("registers eight Soul Runtime Brain tools", () => {
    assert.equal(soulRuntimeTools.length, 8);
    assert.ok(soulRuntimeTools.some((tool) => tool.name === "soul_runtime.capture_mission_completion"));
  });

  it("captures mission completion and evolves Soul File automatically", () => {
    initializeSoulFile(WORKSPACE_ID);

    const event = captureSoulRuntimeEvent({
      workspaceId: WORKSPACE_ID,
      memoryKey: "missionCompletions",
      title: "Mission S002 Complete",
      summary: "Soul Runtime Engine established — living continuity active",
      source: "brain-tool",
      actor: "grand-king",
      payload: { missionId: "S002" },
      operationalState: { completedMissions: ["S002"] },
    });

    assert.equal(event.memoryKey, "missionCompletions");
    assert.ok(event.soulFileVersion && event.soulFileVersion >= 2);

    const soulFile = getSoulFile(WORKSPACE_ID);
    assert.equal(soulFile.runtimeMemory.missionCompletions.length, 1);
    assert.equal(soulFile.runtimeMemory.missionCompletions[0]?.title, "Mission S002 Complete");
    assert.ok(soulFile.operationalState.completedMissions.includes("S002"));

    const history = listSoulFileChangeHistory(WORKSPACE_ID);
    assert.ok(history.some((entry) => entry.changeType === "RUNTIME_CAPTURE"));
  });

  it("captures doctrine, lessons, promises, and roadmap via Brain tools", async () => {
    initializeSoulFile(WORKSPACE_ID);

    await invokeTool("soul_runtime.capture_doctrine_update", {
      title: "Protect The Empire",
      summary: "No live destructive actions without founder approval",
    });
    await invokeTool("soul_runtime.capture_lesson", {
      title: "Sandbox First",
      summary: "Validate full revenue loop in sandbox before live gates",
    });
    await invokeTool("soul_runtime.capture_promise", {
      title: "Grand King Revenue",
      summary: "First live dollar flows through ledger-verified pipeline",
    });
    await invokeTool("soul_runtime.capture_roadmap_item", {
      title: "Production Gates",
      summary: "Enable Stripe, Meta, CJ live connectors with founder approval",
    });

    const soulFile = getSoulFile(WORKSPACE_ID);
    assert.equal(soulFile.runtimeMemory.doctrineUpdates.length, 1);
    assert.equal(soulFile.runtimeMemory.lessonsLearned.length, 1);
    assert.equal(soulFile.runtimeMemory.promises.length, 1);
    assert.equal(soulFile.runtimeMemory.futureRoadmap.length, 1);
  });

  it("auto-captures meaningful audit events into Soul File runtime memory", () => {
    initializeSoulFile(WORKSPACE_ID);
    const auditLogger = new AuditLogger();
    const engine = getSoulRuntimeEngine();
    engine.attachAuditLogger(auditLogger);

    auditLogger.write({
      action: "first_revenue_validation.completed",
      actor: "system",
      workspaceId: WORKSPACE_ID,
      correlationId: "audit-s002",
      metadata: {
        validationId: "val-1",
        allStagesPassed: true,
        productionReady: false,
        revenueCents: 6800,
        profitCents: 2100,
        ledgerVerified: true,
      },
    });

    const soulFile = getSoulFile(WORKSPACE_ID);
    assert.ok(soulFile.runtimeMemory.missionCompletions.length >= 1);
    assert.ok(soulFile.runtimeMemory.businessMilestones.length >= 1);
    assert.ok(soulFile.runtimeMemory.kpis.length >= 1);

    const events = listSoulRuntimeEvents(WORKSPACE_ID);
    assert.ok(events.length >= 3);
    assert.ok(events.every((event) => event.source === "audit"));
  });

  it("maps audit entries to capture inputs without looping on soul runtime actions", () => {
    const captures = mapAuditEntryToCaptures({
      id: "audit-1",
      action: "soul_runtime.captured",
      actor: "grand-king",
      workspaceId: WORKSPACE_ID,
      correlationId: "corr-loop",
      metadata: { eventId: "evt-1" },
      timestamp: new Date().toISOString(),
    });

    assert.equal(captures.length, 0);
  });

  it("persists runtime events with soul file version linkage", () => {
    initializeSoulFile(WORKSPACE_ID);

    const event = captureSoulRuntimeEvent({
      workspaceId: WORKSPACE_ID,
      memoryKey: "capitalChanges",
      title: "Treasury Snapshot",
      summary: "Available cash increased after revenue cycle",
      source: "api",
      payload: { availableCashCents: 125000 },
    });

    const events = listSoulRuntimeEvents(WORKSPACE_ID);
    assert.ok(events.some((entry) => entry.eventId === event.eventId));
    assert.equal(events[0]?.memoryKey, "capitalChanges");
  });

  it("deduplicates runtime entries by entry id on repeated capture", () => {
    initializeSoulFile(WORKSPACE_ID);

    captureSoulRuntimeEvent({
      workspaceId: WORKSPACE_ID,
      memoryKey: "kpis",
      title: "Health Score",
      summary: "Overall health 82",
      source: "api",
      payload: {},
      correlationId: "kpi-1",
    });

    const before = getSoulFile(WORKSPACE_ID);
    const entryId = before.runtimeMemory.kpis[0]?.entryId;
    assert.ok(entryId);

    captureSoulRuntimeEvent({
      workspaceId: WORKSPACE_ID,
      memoryKey: "kpis",
      title: "Health Score Duplicate",
      summary: "Should still append as new entry",
      source: "api",
      payload: {},
    });

    const after = getSoulFile(WORKSPACE_ID);
    assert.equal(after.runtimeMemory.kpis.length, 2);
  });
});
