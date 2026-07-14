import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EXECUTIVE_DECISION_EKLS_KINDS,
  EXECUTIVE_DECISION_TYPES,
  EXECUTIVE_DOMAIN_IDS,
  GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION,
  aggregateExecutiveKpis,
  buildCockpitExecutiveDecisionCentreView,
  createGrandKingExecutiveDecisionCentreModuleContract,
  executeExecutiveDecision,
  generateExecutiveRecommendations,
  getExecutiveGlobalDashboard,
  getExecutiveHealth,
  getExecutiveOperationsOverview,
  getExecutiveSummary,
  grandKingExecutiveDecisionCentreTools,
  initializeExecutiveDecisionCentre,
  isValidExecutiveDecisionTransition,
  listExecutiveDecisionEklsKinds,
  listExecutiveDecisionPlugins,
  listExecutiveDecisionRegistryIds,
  listExecutiveDecisions,
  registerExecutiveDecisionPlugin,
  resetGrandKingExecutiveDecisionCentreHarnessForTests,
  searchExecutiveDecisionEklsObservations,
  validateExecutiveDecisionPillowGovernance,
} from "../../orchestration/grand-king-executive-decision-centre/index.js";
import {
  initializeAutomationOperations,
  resetGrandKingBusinessAutomationOperationsHarnessForTests,
} from "../../orchestration/grand-king-business-automation-operations/index.js";
import {
  initializeCommerceOperations,
  resetGrandKingCommerceOperationsHarnessForTests,
} from "../../orchestration/grand-king-commerce-operations/index.js";
import { resetGrandKingLiveOperationsHarnessForTests } from "../../orchestration/grand-king-live-operations/index.js";
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

async function seedProductionStack(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  resetGrandKingProductionWorkspaceHarnessForTests();
  resetGrandKingCommerceOperationsHarnessForTests();
  resetGrandKingBusinessAutomationOperationsHarnessForTests();
  resetGrandKingExecutiveDecisionCentreHarnessForTests();
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
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
}

async function seedExecutiveCentre() {
  await seedProductionStack();
  return initializeExecutiveDecisionCentre({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-04 — Grand King Executive Decision Centre", () => {
  it("exposes executive decision centre framework version and domains", () => {
    assert.equal(GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION, "g7-04-v1");
    assert.equal(EXECUTIVE_DOMAIN_IDS.length, 14);
    assert.equal(EXECUTIVE_DECISION_TYPES.length, 12);
  });

  it("registers grand-king-executive-decision-centre Brain module contract", () => {
    const contract = createGrandKingExecutiveDecisionCentreModuleContract();
    assert.equal(contract.moduleId, "grand-king-executive-decision-centre");
    assert.equal(contract.missionId, "G7-04");
    assert.equal(contract.programmeStatus, "executive-decision-centre-established");
    assert.ok(contract.integratesWith.includes("cockpit"));
  });

  it("aggregates executive KPIs from G7 stack", async () => {
    await seedProductionStack();
    const kpis = aggregateExecutiveKpis({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(kpis.empireHealthScore >= 0);
    assert.ok(kpis.productionReadiness >= 0);
    assert.ok(kpis.automationSuccessRate >= 0);
    assert.ok(["low", "medium", "high", "critical"].includes(kpis.riskLevel));
    assert.ok(kpis.policyReference);
  });

  it("initializes executive decisions with full contract fields", async () => {
    const result = await seedExecutiveCentre();
    assert.ok(result.decisions.length >= 1);
    assert.ok(result.recommendations.length >= 1);

    for (const decision of result.decisions) {
      assert.ok(decision.decisionId);
      assert.ok(decision.decisionType);
      assert.equal(decision.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.equal(decision.accountHolderId, "grand-king");
      assert.ok(decision.sourceModule);
      assert.ok(decision.targetModule);
      assert.ok(decision.priority);
      assert.ok(decision.status);
      assert.ok(decision.recommendedAction);
      assert.ok(decision.approvalReference);
      assert.ok(decision.riskReference);
      assert.ok(Array.isArray(decision.evidence));
      assert.ok(decision.createdAt);
      assert.ok(decision.correlationId);
      assert.ok(decision.governanceState);
    }
  });

  it("generates registry-driven executive recommendations", async () => {
    await seedProductionStack();
    const recommendations = generateExecutiveRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(recommendations.length >= 1);
    for (const rec of recommendations) {
      assert.ok(rec.ruleReference.startsWith("rule:"));
    }
  });

  it("validates executive decision lifecycle transitions", () => {
    assert.equal(isValidExecutiveDecisionTransition("pending", "approved"), true);
    assert.equal(isValidExecutiveDecisionTransition("executing", "completed"), true);
    assert.equal(isValidExecutiveDecisionTransition("completed", "pending"), false);
  });

  it("executes executive decisions through command manager", async () => {
    await seedExecutiveCentre();
    const pending = listExecutiveDecisions().find((d) => d.status === "pending");
    assert.ok(pending);

    const executed = executeExecutiveDecision({
      ...TEST_ACTOR,
      decisionId: pending!.decisionId,
      decisionType: "approve",
    });
    assert.equal(executed.status, "completed");
    assert.equal(executed.executedAction, "approve");
  });

  it("registers all required executive Brain tools", () => {
    const names = new Set(grandKingExecutiveDecisionCentreTools.map((tool) => tool.name));
    for (const toolName of [
      "executive_overview",
      "executive_health",
      "executive_decisions",
      "executive_recommendations",
      "executive_blockers",
      "executive_opportunities",
      "executive_notifications",
      "executive_timeline",
      "executive_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for executive decisions", async () => {
    await seedProductionStack();
    const result = validateExecutiveDecisionPillowGovernance({
      ...TEST_ACTOR,
      operation: "execute",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.decisionAuthority, true);
    assert.equal(result.approvalAuthority, true);
    assert.equal(result.workspaceAuthority, true);
    assert.equal(result.productionAuthority, true);
    assert.equal(result.riskPolicy, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records executive decision EKLS observations through Pillow", async () => {
    await seedExecutiveCentre();
    assert.deepEqual(listExecutiveDecisionEklsKinds(), [...EXECUTIVE_DECISION_EKLS_KINDS]);

    const search = searchExecutiveDecisionEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "executive_recommendation_generated",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit executive decision centre backend contract", async () => {
    await seedExecutiveCentre();
    const overview = getExecutiveOperationsOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = getExecutiveGlobalDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getExecutiveSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitExecutiveDecisionCentreView({
      overview,
      kpis: dashboard.kpis,
      decisionQueue: {
        pendingCount: overview.pendingDecisions,
        decisions: listExecutiveDecisions().map((d) => ({
          decisionId: d.decisionId,
          decisionType: d.decisionType,
          status: d.status,
        })),
      },
      recommendations: dashboard.recommendations,
      timeline: dashboard.timeline,
      notifications: dashboard.notifications,
      blockers: dashboard.blockers,
      risks: dashboard.risks,
      approvals: dashboard.approvals,
      opportunities: dashboard.opportunities,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-executive-decision-centre");
    assert.equal(view.dataMode, "executive");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.ok(view.executiveKpis.empireHealthScore >= 0);
    assert.ok(view.recommendationCentre.count >= 1);
  });

  it("lists executive decision registry ids", () => {
    const ids = listExecutiveDecisionRegistryIds();
    assert.equal(ids.length, 6);
    assert.ok(ids.includes("REG-EXECUTIVE-POLICY"));
    assert.ok(ids.includes("REG-AUTOMATION-POLICY"));
    assert.ok(ids.includes("REG-COMMERCE-POLICY"));
  });

  it("supports executive decision plugins without modifying core", async () => {
    await seedExecutiveCentre();
    for (const pluginKind of ["decision", "recommendation", "kpi", "notification", "timeline"] as const) {
      const result = registerExecutiveDecisionPlugin({
        manifest: {
          pluginId: `test-${pluginKind}`,
          pluginName: `Test ${pluginKind}`,
          pluginKind,
          pillowGovernance: true,
        },
        actorId: TEST_ACTOR.actorId,
        workspaceId: CANONICAL_WORKSPACE_ID,
        ownerId: TEST_ACTOR.ownerId,
        pillowGovernance: true,
      });
      assert.equal(result.accepted, true);
    }
    assert.equal(listExecutiveDecisionPlugins().length, 5);
  });

  it("builds global operational dashboard with blockers and opportunities", async () => {
    await seedExecutiveCentre();
    const dashboard = getExecutiveGlobalDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(dashboard.domains.length, 14);
    assert.ok(dashboard.kpis);
    assert.ok(dashboard.recommendations.length >= 1);
    assert.ok(Array.isArray(dashboard.timeline));
  });

  it("does not expose credentials or secrets in executive output", async () => {
    await seedExecutiveCentre();
    const health = getExecutiveHealth({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = getExecutiveGlobalDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify({ health, dashboard });
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("secret"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
