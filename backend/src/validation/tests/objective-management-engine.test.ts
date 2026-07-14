import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  assessImplementationRecommendation,
  buildObjectiveDashboard,
  evaluateObjective,
  initializeObjectiveManagement,
  objectiveManagementTools,
  resetObjectiveManagementRepository,
} from "../../orchestration/objective-management-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE = "ws-oms-test";
const COMPANY = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE,
    agentId: "objective-management",
    correlationId: "corr-oms",
    companyId: COMPANY,
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = objectiveManagementTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE, companyId: COMPANY, ...args }, toolContext());
}

describe("Objective Management System (OMS)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetObjectiveManagementRepository();
    resetDatabaseInstance();
    configureValidationEnvironment();
  });

  afterEach(() => {
    resetObjectiveManagementRepository();
    resetDatabaseInstance();
  });

  it("seeds OBJ-001 PROOF-001 on initialize", () => {
    const objectives = initializeObjectiveManagement(WORKSPACE, COMPANY);
    assert.equal(objectives.length, 1);
    assert.equal(objectives[0]?.objectiveId, "OBJ-001");
    assert.equal(objectives[0]?.title, "PROOF-001");
    assert.equal(objectives[0]?.executivePriority, "CRITICAL");
    assert.equal(objectives[0]?.owner, "Pillow");
    assert.equal(objectives[0]?.status, "ACTIVE");
  });

  it("evaluates OBJ-001 against live Brain signals", () => {
    initializeObjectiveManagement(WORKSPACE, COMPANY);
    const { objective } = evaluateObjective("OBJ-001");
    assert.equal(objective.objectiveId, "OBJ-001");
    assert.ok(objective.currentProgressPercent >= 0);
    assert.ok(objective.confidencePercent >= 0);
    assert.ok(["GREEN", "YELLOW", "RED"].includes(objective.overallHealth));
    assert.ok(objective.nextHighestImpactAction);
    assert.ok(objective.criticalPath.length > 0);
  });

  it("builds dashboard with prioritized active objectives", () => {
    initializeObjectiveManagement(WORKSPACE, COMPANY);
    const dashboard = buildObjectiveDashboard(WORKSPACE, COMPANY);
    assert.equal(dashboard.workspaceId, WORKSPACE);
    assert.ok(dashboard.primaryObjective);
    assert.equal(dashboard.primaryObjective?.objectiveId, "OBJ-001");
    assert.ok(dashboard.prioritizedObjectiveIds.includes("OBJ-001"));
  });

  it("rejects implementation that does not align with active objectives", () => {
    initializeObjectiveManagement(WORKSPACE, COMPANY);
    const assessment = assessImplementationRecommendation({
      title: "Refactor theme colors",
      summary: "Update dashboard CSS palette for aesthetic refresh",
      workspaceId: WORKSPACE,
      companyId: COMPANY,
    });
    assert.equal(assessment.recommended, false);
    assert.equal(assessment.probabilityImpact, "decreases");
  });

  it("accepts implementation aligned with PROOF-001 path", () => {
    initializeObjectiveManagement(WORKSPACE, COMPANY);
    const assessment = assessImplementationRecommendation({
      title: "Production deploy",
      summary: "Deploy backend to Railway and configure production env for B5",
      workspaceId: WORKSPACE,
      companyId: COMPANY,
    });
    assert.equal(assessment.recommended, true);
    assert.ok(assessment.alignedObjectiveIds.includes("OBJ-001"));
  });

  it("registers Brain dashboard tool", async () => {
    initializeObjectiveManagement(WORKSPACE, COMPANY);
    const dashboard = (await invokeTool("objective_management.dashboard")) as {
      primaryObjective: { objectiveId: string } | null;
    };
    assert.equal(dashboard.primaryObjective?.objectiveId, "OBJ-001");
  });
});
