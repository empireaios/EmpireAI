import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  archiveStrategicMemory,
  getStrategicMemory,
  getStrategicMemorySummary,
  initializeStrategicMemory,
  listStrategicMemoryLifecycle,
  listStrategicMemories,
  modifyStrategicMemory,
  recallStrategicMemories,
  recordStrategicMemory,
  resetStrategicMemoryRepository,
  STRATEGIC_MEMORY_CATEGORIES,
  strategicMemoryTools,
  supersedeStrategicMemory,
} from "../../foundation/strategic-memory-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s010";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "strategic-memory-engine",
    correlationId: "corr-s010",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = strategicMemoryTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetStrategicMemoryRepository();
});

afterEach(() => {
  resetStrategicMemoryRepository();
  resetDatabaseInstance();
});

describe("S010 Strategic Memory Engine", () => {
  it("registers ten strategic memory Brain tools", () => {
    assert.equal(strategicMemoryTools.length, 10);
    assert.ok(strategicMemoryTools.some((tool) => tool.name === "strategic_memory.record"));
    assert.ok(strategicMemoryTools.some((tool) => tool.name === "strategic_memory.recall"));
  });

  it("seeds default memories across all seven categories", () => {
    const memories = initializeStrategicMemory(WORKSPACE_ID);

    assert.equal(memories.length, 7);
    for (const category of STRATEGIC_MEMORY_CATEGORIES) {
      assert.ok(
        memories.some((m) => m.category === category),
        `expected seeded memory for category ${category}`,
      );
    }
    assert.ok(memories.every((m) => m.status === "ACTIVE"));
  });

  it("records a new strategic memory with lifecycle", () => {
    initializeStrategicMemory(WORKSPACE_ID);

    const memory = recordStrategicMemory({
      workspaceId: WORKSPACE_ID,
      memoryId: "memory:test-failure",
      category: "failures",
      title: "Test Failure Lesson",
      insight: "Never skip validation gates before live deploy",
      context: "S010 validation harness",
      tags: ["validation", "failure"],
      importance: 4,
      actor: "founder@test.com",
    });

    assert.equal(memory.category, "failures");
    assert.equal(memory.status, "ACTIVE");
    assert.equal(memory.recallCount, 0);

    const lifecycle = listStrategicMemoryLifecycle("memory:test-failure");
    assert.ok(lifecycle.some((e) => e.event === "RECORDED"));
  });

  it("recalls memories by category, query, and tags", () => {
    initializeStrategicMemory(WORKSPACE_ID);

    recordStrategicMemory({
      workspaceId: WORKSPACE_ID,
      memoryId: "memory:capital-test",
      category: "capitalLessons",
      title: "Capital Discipline Test",
      insight: "Reserve ad spend before scaling campaigns",
      tags: ["capital", "ads"],
      actor: "founder@test.com",
    });

    const byCategory = recallStrategicMemories({
      workspaceId: WORKSPACE_ID,
      category: "capitalLessons",
      actor: "operator@test.com",
    });
    assert.ok(byCategory.some((m) => m.memoryId === "memory:capital-test"));
    assert.ok(byCategory.some((m) => m.memoryId === "memory:capital-reserved-cash"));

    const byQuery = recallStrategicMemories({
      workspaceId: WORKSPACE_ID,
      query: "governance",
      actor: "operator@test.com",
    });
    assert.ok(byQuery.some((m) => m.title.toLowerCase().includes("governance")));

    const byTags = recallStrategicMemories({
      workspaceId: WORKSPACE_ID,
      tags: ["ads"],
      actor: "operator@test.com",
    });
    assert.ok(byTags.some((m) => m.memoryId === "memory:capital-test"));

    const recalled = getStrategicMemory("memory:capital-test");
    assert.ok(recalled);
    assert.ok(recalled.recallCount >= 1);
  });

  it("modifies active memories and blocks terminal entries", () => {
    initializeStrategicMemory(WORKSPACE_ID);

    const updated = modifyStrategicMemory({
      memoryId: "memory:policy-without-code",
      insight: "Policy engine enables Grand King to change gates without redeploy",
      importance: 5,
      actor: "founder@test.com",
    });

    assert.equal(updated.version, 2);
    assert.equal(updated.importance, 5);

    archiveStrategicMemory("memory:policy-without-code", "founder@test.com");
    assert.throws(
      () =>
        modifyStrategicMemory({
          memoryId: "memory:policy-without-code",
          title: "Should fail",
        }),
      /terminal memories are immutable/,
    );
  });

  it("archives and supersedes without deleting records", () => {
    initializeStrategicMemory(WORKSPACE_ID);

    recordStrategicMemory({
      workspaceId: WORKSPACE_ID,
      memoryId: "memory:old-supplier",
      category: "supplierLessons",
      title: "Old Supplier Approach",
      insight: "Direct live CJ without sandbox",
      actor: "founder@test.com",
    });

    recordStrategicMemory({
      workspaceId: WORKSPACE_ID,
      memoryId: "memory:new-supplier",
      category: "supplierLessons",
      title: "Sandbox First",
      insight: "Always validate in sandbox before live CJ",
      actor: "founder@test.com",
    });

    const superseded = supersedeStrategicMemory(
      "memory:old-supplier",
      "memory:new-supplier",
      "founder@test.com",
    );
    assert.equal(superseded.status, "SUPERSEDED");
    assert.equal(superseded.supersededBy, "memory:new-supplier");
    assert.ok(getStrategicMemory("memory:old-supplier"));

    const archived = archiveStrategicMemory("memory:marketing-founder-approval", "founder@test.com");
    assert.equal(archived.status, "ARCHIVED");

    const all = listStrategicMemories(WORKSPACE_ID);
    assert.ok(all.some((m) => m.memoryId === "memory:old-supplier"));
    assert.ok(all.some((m) => m.memoryId === "memory:marketing-founder-approval"));
  });

  it("returns summary counts by category", () => {
    initializeStrategicMemory(WORKSPACE_ID);

    const summary = getStrategicMemorySummary(WORKSPACE_ID);
    assert.equal(summary.workspaceId, WORKSPACE_ID);
    assert.equal(summary.totalMemories, 7);
    assert.equal(summary.byCategory.failures, 1);
    assert.equal(summary.byCategory.successes, 1);
    assert.equal(summary.byCategory.architecture, 1);
    assert.equal(summary.byCategory.businessLessons, 1);
    assert.equal(summary.byCategory.capitalLessons, 1);
    assert.equal(summary.byCategory.supplierLessons, 1);
    assert.equal(summary.byCategory.marketingLessons, 1);
  });

  it("exposes strategic memory operations via Brain tools", async () => {
    const listed = (await invokeTool("strategic_memory.list")) as { memories: unknown[] };
    assert.ok(Array.isArray(listed.memories));
    assert.ok((listed.memories as unknown[]).length >= 7);

    const summary = await invokeTool("strategic_memory.get_summary");
    assert.ok(summary && typeof summary === "object" && "totalMemories" in summary);

    const memory = await invokeTool("strategic_memory.get", {
      memoryId: "memory:revenue-truth-doctrine",
    });
    assert.ok(memory && typeof memory === "object" && "insight" in memory);
  });
});
