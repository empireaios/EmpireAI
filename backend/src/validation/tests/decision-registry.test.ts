import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  approveDecision,
  CANONICAL_DECISION_IDS,
  decisionRegistryTools,
  deprecateDecision,
  getDecision,
  initializeDecisionRegistry,
  listDecisionLifecycle,
  listDecisions,
  proposeDecision,
  recordDecision,
  resetDecisionRepository,
  supersedeDecision,
} from "../../foundation/decision-registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s009";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "decision-registry",
    correlationId: "corr-s009",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = decisionRegistryTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetDecisionRepository();
});

afterEach(() => {
  resetDecisionRepository();
  resetDatabaseInstance();
});

describe("S009 Decision Registry", () => {
  it("registers ten decision registry Brain tools", () => {
    assert.equal(decisionRegistryTools.length, 10);
    assert.ok(decisionRegistryTools.some((tool) => tool.name === "decision_registry.record"));
    assert.ok(decisionRegistryTools.some((tool) => tool.name === "decision_registry.approve"));
  });

  it("seeds default architectural and strategic decisions", () => {
    const decisions = initializeDecisionRegistry(WORKSPACE_ID);

    assert.equal(decisions.length, 4);
    assert.ok(decisions.some((d) => d.decisionId === CANONICAL_DECISION_IDS.SOUL_FILE_FOUNDATION));
    assert.ok(decisions.some((d) => d.decisionId === CANONICAL_DECISION_IDS.GOVERNANCE_BEFORE_GUARDIAN));
    assert.ok(decisions.every((d) => d.status === "APPROVED"));
    assert.ok(decisions.every((d) => d.alternatives.length >= 1));
    assert.ok(decisions.every((d) => d.tradeoffs.length >= 1));
  });

  it("captures reason, alternatives, tradeoffs, approver, and timestamp", () => {
    initializeDecisionRegistry(WORKSPACE_ID);

    const decision = recordDecision({
      workspaceId: WORKSPACE_ID,
      decisionId: "decision:test-capture",
      title: "Test Architectural Decision",
      category: "architectural",
      decision: "Use SQLite for foundation persistence",
      reason: "Single-process Empire brain with sql.js compatibility for validation",
      alternatives: [
        {
          name: "PostgreSQL",
          description: "External database server",
          rejectedReason: "Adds deployment complexity for foundation bootstrap",
        },
      ],
      tradeoffs: [
        { benefit: "Zero external deps in dev", cost: "Not ideal for multi-node scale yet" },
      ],
      approver: "founder@test.com",
      approvedAt: "2026-03-01T12:00:00.000Z",
      actor: "founder@test.com",
    });

    assert.equal(decision.reason, "Single-process Empire brain with sql.js compatibility for validation");
    assert.equal(decision.alternatives.length, 1);
    assert.equal(decision.tradeoffs.length, 1);
    assert.equal(decision.approver, "founder@test.com");
    assert.equal(decision.approvedAt, "2026-03-01T12:00:00.000Z");
    assert.equal(decision.status, "APPROVED");
  });

  it("supports propose and approve workflow", () => {
    initializeDecisionRegistry(WORKSPACE_ID);

    const proposed = proposeDecision({
      workspaceId: WORKSPACE_ID,
      decisionId: "decision:proposed-test",
      title: "Proposed Strategic Decision",
      category: "strategic",
      decision: "Expand to multi-workspace",
      reason: "Grand King portfolio growth",
      approver: "founder@test.com",
      actor: "operator@test.com",
    });

    assert.equal(proposed.status, "PROPOSED");

    const approved = approveDecision("decision:proposed-test", "founder@test.com");
    assert.equal(approved.status, "APPROVED");
    assert.ok(approved.approvedAt);

    const lifecycle = listDecisionLifecycle("decision:proposed-test");
    assert.ok(lifecycle.some((e) => e.event === "RECORDED"));
    assert.ok(lifecycle.some((e) => e.event === "APPROVED"));
  });

  it("supersedes decisions while preserving history", () => {
    initializeDecisionRegistry(WORKSPACE_ID);

    recordDecision({
      workspaceId: WORKSPACE_ID,
      decisionId: "decision:old-arch",
      title: "Old Architecture",
      category: "architectural",
      decision: "Monolith only",
      reason: "Simplicity",
      approver: "founder@test.com",
    });

    recordDecision({
      workspaceId: WORKSPACE_ID,
      decisionId: "decision:new-arch",
      title: "New Architecture",
      category: "architectural",
      decision: "Modular foundation",
      reason: "Scale missions independently",
      approver: "founder@test.com",
    });

    const superseded = supersedeDecision("decision:old-arch", "decision:new-arch", "founder@test.com");
    assert.equal(superseded.status, "SUPERSEDED");
    assert.equal(superseded.supersededBy, "decision:new-arch");
    assert.ok(getDecision("decision:old-arch"));
  });

  it("deprecates decisions without removing them from registry", () => {
    initializeDecisionRegistry(WORKSPACE_ID);

    recordDecision({
      workspaceId: WORKSPACE_ID,
      decisionId: "decision:to-deprecate",
      title: "Deprecated Approach",
      category: "technical",
      decision: "Use inline env checks",
      reason: "Initial prototype",
      approver: "founder@test.com",
    });

    const deprecated = deprecateDecision("decision:to-deprecate", "founder@test.com", "Replaced by policy engine");
    assert.equal(deprecated.status, "DEPRECATED");

    const all = listDecisions(WORKSPACE_ID);
    assert.ok(all.some((d) => d.decisionId === "decision:to-deprecate"));
  });

  it("filters decisions by category", () => {
    initializeDecisionRegistry(WORKSPACE_ID);

    const architectural = listDecisions(WORKSPACE_ID, { category: "architectural" });
    assert.ok(architectural.length >= 2);
    assert.ok(architectural.every((d) => d.category === "architectural"));

    const strategic = listDecisions(WORKSPACE_ID, { category: "strategic" });
    assert.ok(strategic.length >= 2);
    assert.ok(strategic.every((d) => d.category === "strategic"));
  });

  it("exposes decision operations via Brain tools", async () => {
    const listed = (await invokeTool("decision_registry.list")) as { decisions: unknown[] };
    assert.ok(Array.isArray(listed.decisions));
    assert.ok((listed.decisions as unknown[]).length >= 4);

    const decision = await invokeTool("decision_registry.get", {
      decisionId: CANONICAL_DECISION_IDS.DOCTRINE_AS_POLICY,
    });
    assert.ok(decision && typeof decision === "object" && "reason" in decision);
  });
});
