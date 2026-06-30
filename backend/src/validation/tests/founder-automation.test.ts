import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  analyzeAutomationOpportunities,
  buildFounderJourney,
  buildFounderWorkloadDashboard,
  buildHumanActionQueue,
  createAutomationPlan,
  resetFounderAutomationRepository,
} from "../../runtime/founder-automation/index.js";
import { buildOrLoadGlobalCommerceIdentity, resetGlobalCommerceRepository } from "../../runtime/global-commerce/index.js";
import { resetGlobalCommerceIntelligenceRepository } from "../../runtime/global-commerce-intelligence/index.js";
import { resetEmpireKnowledgeRepository } from "../../runtime/empire-knowledge/index.js";
import { resetRuntimePluginRegistry } from "../../runtime/plugins/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-e011";
const COMPANY_ID = "co-grand-king";

describe("Program Echo — Founder Automation (E-011–E-015)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalCommerceRepository();
    resetGlobalCommerceIntelligenceRepository();
    resetEmpireKnowledgeRepository();
    resetFounderAutomationRepository();
    resetRuntimePluginRegistry();
  });

  afterEach(() => {
    resetFounderAutomationRepository();
    resetGlobalCommerceRepository();
    resetGlobalCommerceIntelligenceRepository();
    resetEmpireKnowledgeRepository();
    resetRuntimePluginRegistry();
    resetDatabaseInstance();
  });

  it("E-011 — founder journey models complete lifecycle with 9 stages", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const journey = buildFounderJourney(WORKSPACE_ID, COMPANY_ID);

    assert.ok(journey.journeyId);
    assert.equal(journey.stages.length, 9);
    assert.ok(journey.stages.some((s) => s.stageId === "registration"));
    assert.ok(journey.stages.some((s) => s.stageId === "launch_approval"));
    assert.ok(journey.stages.some((s) => s.stageId === "expansion_approval"));
    assert.ok(journey.overallProgressPercent >= 0);
  });

  it("E-012 — human action queue structures tasks with priority and blocking impact", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const queue = buildHumanActionQueue(WORKSPACE_ID, COMPANY_ID);

    assert.ok(queue.totalCount > 0);
    assert.ok(queue.tasks.every((t) => t.title && t.reason && t.priority));
    assert.ok(queue.tasks.every((t) => t.estimatedCompletionMinutes >= 0));
    assert.ok(queue.tasks.every((t) => t.blockingImpact));
    assert.ok(queue.tasks.every((t) => t.automationStatus));
    assert.ok(queue.tasks.some((t) => t.title.includes("Verify identity") || t.title.includes("KYC") || t.category === "kyc"));
  });

  it("E-013 — automation opportunity engine classifies tasks", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const summary = analyzeAutomationOpportunities(WORKSPACE_ID, COMPANY_ID);

    assert.ok(summary.totalTasks > 0);
    assert.ok(summary.overallAutomationPercentage >= 0);
    assert.ok(summary.estimatedHoursSaved >= 0);
    assert.ok(summary.manualHoursRemaining >= 0);
    assert.ok(summary.opportunities.every((o) => o.classification));
  });

  it("E-015 — automation planner generates step plan for country launch", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const plan = createAutomationPlan(WORKSPACE_ID, COMPANY_ID, {
      goal: "launch_country",
      targetCountryCode: "DE",
      productCategory: "electronics",
    });

    assert.ok(plan.planId);
    assert.equal(plan.targetCountryCode, "DE");
    assert.ok(plan.humanActionsOnly.length > 0);
    assert.ok(plan.empireAiActions.length > 0);
    assert.ok(plan.estimatedCompletionHours > 0);
    assert.ok(plan.summary.includes("Germany") || plan.summary.includes("DE"));
  });

  it("E-014 — founder workload dashboard exposes Mission Control payload", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const dashboard = buildFounderWorkloadDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "founder-automation");
    assert.equal(dashboard.missionId, "E-011-E-015");
    assert.ok(dashboard.todaysTasks.length >= 0);
    assert.ok(dashboard.automationPercent >= 0);
    assert.ok(dashboard.launchReadiness.percent >= 0);
    assert.ok(dashboard.currentJourneyStage.length > 0);
  });
});
