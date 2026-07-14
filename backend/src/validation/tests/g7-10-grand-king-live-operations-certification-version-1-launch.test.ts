import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FINAL_LIVE_LAUNCH_EKLS_KINDS,
  FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION,
  LIVE_LAUNCH_OUTCOMES,
  LIVE_CERTIFICATION_DOMAIN_IDS,
  buildCockpitVersion1LaunchView,
  createGrandKingLiveOperationsModuleContract,
  finalLiveLaunchCertificationTools,
  getFinalLiveOperationsCertificationOverview,
  getGrandKingLaunchReadinessSummary,
  getLastFinalLiveOperationsCertificationRun,
  getLiveLaunchStatus,
  getLiveOperationHealth,
  getVersion1LaunchSummary,
  listFinalLiveLaunchEklsKinds,
  listFinalLiveCertificationRegistryIds,
  redactLiveLaunchSecrets,
  registerFinalLiveLaunchPlugin,
  resetGrandKingLiveOperationsHarnessForTests,
  resolveFinalLiveCertificationRules,
  runLiveLaunchCertification,
  searchFinalLiveLaunchEklsObservations,
  validateFinalLiveLaunchPillowGovernance,
} from "../../orchestration/grand-king-live-operations/index.js";
import {
  initializeOperationalIntelligence,
  resetGrandKingOperationalIntelligenceHarnessForTests,
} from "../../orchestration/grand-king-operational-intelligence-executive-insights/index.js";
import {
  initializeSelfHealingOperations,
  resetGrandKingSelfHealingOperationsHarnessForTests,
} from "../../orchestration/grand-king-self-healing-operations/index.js";
import {
  initializeAutonomousOperations,
  resetGrandKingAutonomousOperationsHarnessForTests,
} from "../../orchestration/grand-king-autonomous-operations/index.js";
import {
  initializeContinuousIntelligenceOptimization,
  resetGrandKingContinuousIntelligenceOptimizationHarnessForTests,
} from "../../orchestration/grand-king-continuous-intelligence-optimization/index.js";
import {
  initializeFinancialOperations,
  resetGrandKingRevenueFinancialOperationsHarnessForTests,
} from "../../orchestration/grand-king-revenue-financial-operations/index.js";
import {
  initializeExecutiveDecisionCentre,
  resetGrandKingExecutiveDecisionCentreHarnessForTests,
} from "../../orchestration/grand-king-executive-decision-centre/index.js";
import {
  initializeAutomationOperations,
  resetGrandKingBusinessAutomationOperationsHarnessForTests,
} from "../../orchestration/grand-king-business-automation-operations/index.js";
import {
  initializeCommerceOperations,
  resetGrandKingCommerceOperationsHarnessForTests,
} from "../../orchestration/grand-king-commerce-operations/index.js";
import {
  activateGrandKingProductionWorkspace,
  createGrandKingProductionWorkspace,
  resetGrandKingProductionWorkspaceHarnessForTests,
} from "../../orchestration/grand-king-production-workspace/index.js";
import {
  resetProductionCertificationHarnessForTests,
  runFinalProductionReadinessCertification,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  ownerId: "grand-king",
  pillowGovernance: true as const,
};

function configureLiveLaunchTestEnvironment(): void {
  process.env.LIVE_MISSING_EVIDENCE = "false";
  process.env.LIVE_CRITICAL_BLOCKER = "false";
  process.env.LIVE_LAUNCH_BLOCKED = "false";
  process.env.LIVE_LAUNCH_GATE_BLOCKED = "false";
  process.env.LIVE_GRAND_KING_NOT_READY = "false";
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
}

async function seedFullProductionStack(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  resetGrandKingProductionWorkspaceHarnessForTests();
  resetGrandKingCommerceOperationsHarnessForTests();
  resetGrandKingBusinessAutomationOperationsHarnessForTests();
  resetGrandKingExecutiveDecisionCentreHarnessForTests();
  resetGrandKingRevenueFinancialOperationsHarnessForTests();
  resetGrandKingContinuousIntelligenceOptimizationHarnessForTests();
  resetGrandKingAutonomousOperationsHarnessForTests();
  resetGrandKingSelfHealingOperationsHarnessForTests();
  resetGrandKingOperationalIntelligenceHarnessForTests();
  configureLiveLaunchTestEnvironment();

  await runFinalProductionReadinessCertification({
    context: { workspaceId: "ws-foundation" },
    actorId: TEST_ACTOR.actorId,
    workspaceId: "ws-foundation",
    pillowGovernance: true,
  });

  createGrandKingProductionWorkspace({
    context: { workspaceId: CANONICAL_WORKSPACE_ID },
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
  activateGrandKingProductionWorkspace({
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });

  initializeCommerceOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeAutomationOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeExecutiveDecisionCentre({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeFinancialOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeContinuousIntelligenceOptimization({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeAutonomousOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeSelfHealingOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeOperationalIntelligence({ workspaceId: CANONICAL_WORKSPACE_ID });
}

async function seedLiveLaunchCertification() {
  await seedFullProductionStack();
  return runLiveLaunchCertification({
    context: { workspaceId: CANONICAL_WORKSPACE_ID },
    ...TEST_ACTOR,
  });
}

describe("G7-10 — Grand King Live Operations Certification & Version 1 Launch", () => {
  it("exposes live launch certification version and outcomes", () => {
    assert.equal(FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION, "g7-10-v1");
    assert.ok(LIVE_LAUNCH_OUTCOMES.includes("LIVE_READY"));
    assert.ok(LIVE_LAUNCH_OUTCOMES.includes("LIVE_READY_WITH_CONDITIONS"));
    assert.ok(LIVE_LAUNCH_OUTCOMES.includes("LIVE_BLOCKED"));
    assert.equal(LIVE_LAUNCH_OUTCOMES.length, 5);
    assert.equal(LIVE_CERTIFICATION_DOMAIN_IDS.length, 15);
  });

  it("updates grand-king-live-operations module contract to G7-10", () => {
    const contract = createGrandKingLiveOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-live-operations");
    assert.equal(contract.missionId, "G7-10");
    assert.equal(contract.programmeStatus, "live-operations-version-1-certified");
    assert.ok(contract.capabilities.includes("grand-king-live-operations.launch_status"));
  });

  it("resolves final live certification rules from REG-LIVE-OPERATIONS-FINAL-CERTIFICATION", () => {
    resetGrandKingLiveOperationsHarnessForTests();
    configureLiveLaunchTestEnvironment();
    const rules = resolveFinalLiveCertificationRules({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(rules.length >= 16);
    assert.ok(rules.some((r) => r.ruleKind === "grand_king_readiness"));
    assert.ok(rules.some((r) => r.ruleKind === "launch_gate"));
  });

  it("validates final live certification record contract fields", async () => {
    const run = await seedLiveLaunchCertification();
    const record = run.record;
    assert.ok(record.certificationId);
    assert.equal(record.programmeId, "G7");
    assert.equal(record.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.ok(LIVE_LAUNCH_OUTCOMES.includes(record.launchStatus));
    assert.ok(typeof record.liveEligibility === "boolean");
    assert.ok(Array.isArray(record.conditions));
    assert.ok(Array.isArray(record.blockers));
    assert.ok(Array.isArray(record.risks));
    assert.ok(Array.isArray(record.evidence));
    assert.ok(Array.isArray(record.validatedDomains));
    assert.ok(Array.isArray(record.failedDomains));
    assert.ok(Array.isArray(record.warningDomains));
    assert.ok(Array.isArray(record.requiredActions));
    assert.ok(typeof record.overallEmpireHealth === "number");
    assert.ok(record.launchDecision);
    assert.ok(record.createdAt);
    assert.ok(record.completedAt);
    assert.ok(record.correlationId);
    assert.ok(record.governanceState);
    assert.ok(record.grandKingReadiness);
  });

  it("runs live launch certification aggregation across G7 domains", async () => {
    const run = await seedLiveLaunchCertification();
    assert.ok(run.record.validatedDomains.length >= 16);
    assert.ok(run.launchScore >= 0);
    assert.equal(run.discoverySource, "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION");
  });

  it("states launch eligibility clearly", async () => {
    await seedLiveLaunchCertification();
    const status = getLiveLaunchStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(LIVE_LAUNCH_OUTCOMES.includes(status.launchStatus));
    assert.ok(typeof status.liveEligibility === "boolean");
    assert.ok(
      status.launchStatus === "LIVE_READY" ||
        status.launchStatus === "LIVE_READY_WITH_CONDITIONS" ||
        status.launchStatus === "LIVE_BLOCKED" ||
        status.launchStatus === "LIVE_FAILED" ||
        status.launchStatus === "UNKNOWN",
    );
  });

  it("blocks launch when critical blocker signal active", async () => {
    await seedFullProductionStack();
    process.env.LIVE_CRITICAL_BLOCKER = "true";
    const run = await runLiveLaunchCertification({
      context: { workspaceId: CANONICAL_WORKSPACE_ID },
      ...TEST_ACTOR,
    });
    assert.equal(run.record.launchStatus, "LIVE_BLOCKED");
    process.env.LIVE_CRITICAL_BLOCKER = "false";
  });

  it("registers all required live launch Brain tools", () => {
    const names = new Set(finalLiveLaunchCertificationTools.map((tool) => tool.name));
    for (const toolName of [
      "live_launch_status",
      "run_live_launch_certification",
      "grand_king_launch_readiness",
      "live_operation_health",
      "launch_blockers",
      "launch_conditions",
      "launch_risk_register",
      "version1_launch_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for live launch certification", async () => {
    await seedFullProductionStack();
    const result = validateFinalLiveLaunchPillowGovernance({ ...TEST_ACTOR, operation: "run_launch" });
    assert.equal(result.allowed, true);
    assert.equal(result.launchAuthority, true);
    assert.equal(result.productionAuthority, true);
    assert.equal(result.constitutionalCompliance, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records live launch EKLS observations through Pillow", async () => {
    await seedLiveLaunchCertification();
    assert.deepEqual(listFinalLiveLaunchEklsKinds(), [...FINAL_LIVE_LAUNCH_EKLS_KINDS]);
    const search = searchFinalLiveLaunchEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "operational_learning_recorded",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit Version 1 launch backend contract", async () => {
    const run = await seedLiveLaunchCertification();
    const overview = getFinalLiveOperationsCertificationOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getVersion1LaunchSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitVersion1LaunchView({
      overview,
      run,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-version1-launch");
    assert.equal(view.dataMode, "live-launch-certification");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.ok(view.version1LaunchStatus);
    assert.ok(view.grandKingReadiness);
    assert.ok(view.launchChecklist);
    assert.ok(view.launchRisks);
    assert.ok(view.launchConditions);
    assert.ok(view.operationalHealth);
    assert.ok(typeof view.empireHealthScore === "number");
  });

  it("lists final live certification registry ids", () => {
    const ids = listFinalLiveCertificationRegistryIds();
    assert.equal(ids.length, 1);
    assert.ok(ids.includes("REG-LIVE-OPERATIONS-FINAL-CERTIFICATION"));
  });

  it("evaluates Grand King launch readiness", async () => {
    await seedLiveLaunchCertification();
    const readiness = getGrandKingLaunchReadinessSummary();
    assert.ok(typeof readiness.score === "number");
    assert.ok(Array.isArray(readiness.programmeRefsValidated));
    assert.equal(readiness.programmeRefsValidated.length, 10);
  });

  it("generates launch reports", async () => {
    const run = await seedLiveLaunchCertification();
    assert.ok(run.reports.version1LaunchReport);
    assert.ok(run.reports.liveOperationsSummary);
    assert.ok(Array.isArray(run.reports.operationalConditionsRegister));
    assert.ok(Array.isArray(run.reports.launchChecklist));
    assert.ok(run.reports.empireHealthReport);
  });

  it("computes live operation health", async () => {
    await seedLiveLaunchCertification();
    const health = getLiveOperationHealth({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(LIVE_LAUNCH_OUTCOMES.includes(health.launchStatus));
    assert.ok(typeof health.overallEmpireHealth === "number");
  });

  it("supports final live launch plugins", async () => {
    await seedFullProductionStack();
    for (const pluginKind of ["validator", "evidence_collector", "readiness_evaluator", "health_evaluator"] as const) {
      const result = registerFinalLiveLaunchPlugin({
        manifest: {
          pluginId: `test-${pluginKind}`,
          pluginName: `Test ${pluginKind}`,
          pluginKind,
          pillowGovernance: true,
        },
        ...TEST_ACTOR,
      });
      assert.equal(result.accepted, true);
    }
  });

  it("redacts secrets from live launch output", async () => {
    await seedLiveLaunchCertification();
    const run = getLastFinalLiveOperationsCertificationRun();
    const redacted = redactLiveLaunchSecrets({ run, secret: "sk_live_abc", token: "api_key_xyz" });
    assert.equal(JSON.stringify(redacted).includes("sk_live"), false);
    assert.equal(JSON.stringify(redacted).includes("api_key"), false);
  });
});
