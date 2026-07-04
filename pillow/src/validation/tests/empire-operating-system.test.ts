import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import {
  createEmpireOperatingSystemEngine,
  createCompanyFromIntent,
  operateCompanies,
  evaluateBusinessManagement,
  planEmpireScaling,
  assessGovernance,
  EMPIRE_PORTFOLIO,
} from "../../empire-operating-system/index.js";
import {
  startPillow,
  requirePillowEmpireOperatingSystem,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 9 Empire Operating System (PILLOW-EOS-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Empire OS initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const eos = requirePillowEmpireOperatingSystem();
    const state = eos.getState();
    assert.equal(state.osVersion, "PILLOW-EOS-001");
    assert.equal(state.status, "ready");
    assert.ok(state.companiesManaged >= 2);
    assert.equal(state.governanceDomains.length, 6);
  });

  test("Company creation from executive intent", () => {
    const pkg = createCompanyFromIntent("Launch a pet supplies business");
    assert.ok(pkg);
    assert.ok(pkg.brand);
    assert.ok(pkg.productCatalog.length >= 1);
    assert.ok(pkg.launchPlan.length >= 3);
    assert.ok(["ready", "conditional", "not_ready"].includes(pkg.launchReadiness));
  });

  test("Company operation manages portfolio", () => {
    const snapshots = operateCompanies(EMPIRE_PORTFOLIO);
    assert.equal(snapshots.length, EMPIRE_PORTFOLIO.length);
    assert.ok(snapshots.every((s) => s.monthlyRevenueEstimateUsd >= 0));
    assert.ok(snapshots.some((s) => s.status === "operating"));
  });

  test("Autonomous business management evaluates health", () => {
    const snapshots = operateCompanies(EMPIRE_PORTFOLIO);
    const evals = evaluateBusinessManagement(snapshots);
    assert.equal(evals.length, EMPIRE_PORTFOLIO.length);
    assert.ok(evals.every((e) => e.overallHealthScore >= 0 && e.overallHealthScore <= 100));
    assert.ok(evals.every((e) => e.autoRecommendations.length >= 1));
  });

  test("Empire scaling coordinates multiple businesses", () => {
    const snapshots = operateCompanies(EMPIRE_PORTFOLIO);
    const evals = evaluateBusinessManagement(snapshots);
    const plan = planEmpireScaling(EMPIRE_PORTFOLIO, evals);
    assert.ok(plan.activeCompanies >= 2);
    assert.ok(plan.resourceAllocations.length >= 4);
    assert.ok(plan.scalingPriorities.length >= 2);
  });

  test("Full operate cycle produces readiness certification", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const eos = createEmpireOperatingSystemEngine({
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      empireCommander: session.empireCommander,
      commerceIntelligence: session.commerceIntelligence,
      infrastructureCommander: session.infrastructureCommander,
      dueDiligence: session.dueDiligence,
      improvement: session.improvement,
      orchestrator: session.orchestrator,
      objective: session.objective,
      auditReviewer: session.auditReviewer,
    });
    await eos.initialize();

    const governance = assessGovernance({
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      empireCommander: session.empireCommander,
      commerceIntelligence: session.commerceIntelligence,
      infrastructureCommander: session.infrastructureCommander,
      dueDiligence: session.dueDiligence,
      objective: session.objective,
    });
    assert.ok(governance.checks.length === 6);
    assert.ok(governance.overallComplianceScore >= 0);

    const report = await eos.operateEmpire("Scale Empire portfolio");
    assert.equal(report.version, "PILLOW-EOS-001");
    assert.ok(report.portfolio.length >= 2);
    assert.ok(report.managementEvaluations.length >= 2);
    assert.ok(report.optimizationReports.length >= 2);
    assert.ok(["production", "conditional", "not_ready"].includes(report.readiness.certificationLevel));
    assert.match(report.executiveBrief, /Empire Operating System/i);
    assert.ok(eos.getManagedCapabilities().length >= 6);
  });

  test("Context builder attaches empireOperatingSystemBrief", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });

    const task = detectContextTask("Operate Empire businesses and create a new company");
    assert.equal(task, "empire_operating_system");

    const context = await runContextBuild(
      session.bootstrap,
      session.intelligence,
      { userMessage: "Operate Empire businesses and create a new company" },
      {},
      session.technicalChief,
      session.uxDesigner,
      session.cursorBridge,
      session.infrastructureCommander,
      session.commerceIntelligence,
      session.empireCommander,
      session.empireOperatingSystem,
    );

    assert.ok(context.empireOperatingSystemBrief);
    assert.match(context.empireOperatingSystemBrief!, /PILLOW-EOS-001/i);
  });
});
