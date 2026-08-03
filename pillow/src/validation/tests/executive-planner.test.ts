import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildExecutivePlannerConfiguration,
  createExecutivePlanner,
  EP_CAPABILITIES,
  resetExecutivePlannerForTesting,
} from "../../executive-planner/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createExecutivePlanner(bootstrap);
  await engine.initialize();
  engine.connectExecutivePlanner();
  return engine;
}

describe("Q0-01 Executive Planner", () => {
  beforeEach(resetExecutivePlannerForTesting);

  test("1 locks mandatory planning boundaries", () => {
    const c = buildExecutivePlannerConfiguration(REPO_ROOT, {
      neverExecuteWork: false as never,
      neverAssignWorkers: false as never,
      neverInvokeTools: false as never,
      neverApproveActions: false as never,
    });
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverInvokeTools, true);
    assert.equal(c.neverApproveActions, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-EP-001 for Q0-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-01");
    assert.equal(state.engineVersion, "PILLOW-EP-001");
  });

  test("3 accepts a high-level objective and returns a structured plan", async () => {
    const report = (await build()).submitObjective({
      objective: "Expand the portfolio into a new regulated market with compliance and engineering readiness",
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    const plan = report.plans[0]!;
    assert.ok(plan.planId.startsWith("ep-plan-"));
    assert.ok(plan.intent.includes("Intent:"));
    assert.ok(plan.assumptions.length > 0);
    assert.ok(plan.constraints.length > 0);
    assert.ok(plan.risks.length > 0);
    assert.ok(plan.dependencies.length > 0);
    assert.ok(plan.executionStages.length >= 3);
    assert.ok(plan.expectedDeliverables.length > 0);
    assert.ok(plan.approvalRequirements.length > 0);
    assert.ok(plan.successCriteria.length > 0);
    assert.equal(plan.metadataVersion, "EP-001-v1");
  });

  test("4 identifies workforce categories without assigning workers", async () => {
    const plan = (await build()).identifyWorkforceCategories({
      objective: "Build a secure analytics platform for finance and compliance reporting",
      validated: true,
    }).plans[0]!;
    assert.ok(plan.requiredWorkforceCategories.includes("engineering"));
    assert.ok(plan.requiredWorkforceCategories.includes("finance") || plan.requiredWorkforceCategories.includes("compliance"));
    assert.equal(plan.workersAssigned, false);
    assert.equal(plan.neverAssignWorkers, true);
  });

  test("5 rejects execute / assign / invoke / approve boundary violations", async () => {
    const engine = await build();
    assert.equal(engine.submitObjective({ objective: "Launch product expansion", validated: true, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.submitObjective({ objective: "Launch product expansion", validated: true, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.submitObjective({ objective: "Launch product expansion", validated: true, invokeTools: true }).validation.decision, "fail");
    assert.equal(engine.submitObjective({ objective: "Launch product expansion", validated: true, approveActions: true }).validation.decision, "fail");
  });

  test("6 rejects empty or unvalidated objectives", async () => {
    const engine = await build();
    assert.equal(engine.submitObjective({ objective: "", validated: true }).validation.decision, "fail");
    assert.equal(engine.submitObjective({ objective: "Expand global operations with governance", validated: false }).validation.decision, "fail");
  });

  test("7 produces machine-readable plans with traceability", async () => {
    const plan = (await build()).produceExecutionPlan({
      objective: "Scale enterprise operations while preserving constitutional governance",
      validated: true,
      priorityHint: "high",
    }).plans[0]!;
    assert.ok(plan.planTraceId.startsWith("ep-trace-"));
    assert.equal(plan.preservePlanTraceability, true);
    assert.equal(plan.preserveAuditability, true);
    assert.equal(plan.workExecuted, false);
    assert.equal(plan.toolsInvoked, false);
    assert.equal(plan.actionsApproved, false);
  });

  test("8 exposes latest plan for future Q0 consumers", async () => {
    const engine = await build();
    engine.submitObjective({
      objective: "Create a new company from a validated market opportunity",
      validated: true,
    });
    const latest = engine.getLatestPlan();
    assert.ok(latest);
    assert.equal(engine.getPlans().length, 1);
    assert.equal(latest!.neverExecuteWork, true);
  });

  test("9 validates stored plans", async () => {
    const engine = await build();
    engine.submitObjective({
      objective: "Improve portfolio capital allocation under executive governance",
      validated: true,
    });
    assert.equal(engine.validatePlan({ objective: "Improve portfolio capital allocation under executive governance", validated: true }).validation.decision, "pass");
  });

  test("10 reports health and diagnostics", async () => {
    const engine = await build();
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.equal(engine.getCockpitSnapshot().neverAssignWorkers, true);
    assert.ok(EP_CAPABILITIES.includes("produce_structured_execution_plan"));
  });
});
