import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import {
  commerceReadinessTools,
  getCommerceLaunchDecision,
  getCommerceReadinessBlockers,
  getCommerceReadinessEvaluation,
  getCommerceReadinessSummary,
  registerCrirReport,
  resetCrirReportRepository,
} from "../../orchestration/commerce-readiness-engine/index.js";
import {
  buildGrandKingsDashboard,
  resetEcommerceOsWorkflowRepository,
  runGrandKingsResearchPhase,
  startGrandKingsLaunchWorkflow,
  approveLaunchProducts,
} from "../../orchestration/ecommerce-os-orchestrator/index.js";
import {
  completeMarketplaceConnectionFlow,
  resetMarketplaceConnectionEngineRepository,
} from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live004";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "commerce-readiness-engine",
    correlationId: "corr-live004",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = commerceReadinessTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function connectLaunchInfrastructure() {
  const connectorRepo = new ConnectorConnectionRepository();
  connectorRepo.upsert({
    workspaceId: WORKSPACE_ID,
    connectorId: "stripe",
    category: "payments",
    status: "connected",
    credentialsRef: "vault:stripe:live004",
    metadata: { oauth: true },
  });
  connectorRepo.upsert({
    workspaceId: WORKSPACE_ID,
    connectorId: "cj-dropshipping",
    category: "suppliers",
    status: "connected",
    credentialsRef: "vault:cj:live004",
    metadata: { oauth: false },
  });

  completeMarketplaceConnectionFlow({
    workspaceId: WORKSPACE_ID,
    marketplaceId: "amazon",
    credentialsRef: "vault:amazon:live004",
    actor: "founder@test.com",
  });
}

beforeEach(() => {
  configureValidationEnvironment();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetEcommerceOsWorkflowRepository();
  resetCrirReportRepository();
});

afterEach(() => {
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetEcommerceOsWorkflowRepository();
  resetCrirReportRepository();
  resetDatabaseInstance();
});

describe("LIVE-004 Commerce Readiness Engine", () => {
  it("registers four commerce readiness Brain tools", () => {
    assert.equal(commerceReadinessTools.length, 4);
    assert.ok(commerceReadinessTools.some((tool) => tool.name === "commerce_readiness.evaluate"));
    assert.ok(commerceReadinessTools.some((tool) => tool.name === "commerce_readiness.launch_decision"));
  });

  it("returns overall and individual readiness scores", () => {
    const evaluation = getCommerceReadinessEvaluation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(evaluation.overallReadinessScore >= 0 && evaluation.overallReadinessScore <= 100);
    assert.ok(evaluation.individualReadiness.accounts >= 0);
    assert.ok(evaluation.individualReadiness.marketplaces >= 0);
    assert.ok(evaluation.individualReadiness.suppliers >= 0);
    assert.ok(evaluation.individualReadiness.products >= 0);
    assert.ok(evaluation.individualReadiness.brands >= 0);
    assert.ok(evaluation.individualReadiness.fulfillment >= 0);
    assert.ok(evaluation.individualReadiness.payment >= 0);
    assert.ok(evaluation.individualReadiness.governance >= 0);
    assert.ok(evaluation.individualReadiness.treasury >= 0);
    assert.ok(evaluation.individualReadiness.crir >= 0);
  });

  it("returns structured blockers with severity levels", () => {
    const blockers = getCommerceReadinessBlockers({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(blockers.length > 0);
    for (const blocker of blockers) {
      assert.ok(["INFO", "WARNING", "BLOCKING"].includes(blocker.severity));
      assert.ok(blocker.title.length > 0);
      assert.ok(blocker.description.length > 0);
    }

    assert.ok(blockers.some((blocker) => blocker.title.includes("Stripe") || blocker.category === "payment"));
  });

  it("returns NOT_READY when blocking issues exist", () => {
    const decision = getCommerceLaunchDecision({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.equal(decision.launchDecision, "NOT_READY");
    assert.ok(decision.blockingCount > 0);
    assert.ok(decision.recommendedNextAction.length > 0);
  });

  it("returns summary with counts for dashboard consumption", async () => {
    const summary = await invokeTool("commerce_readiness.summary");
    const payload = summary as {
      overallReadinessScore: number;
      launchDecision: string;
      blockingCount: number;
      individualReadiness: { payment: number };
    };
    assert.ok(payload.overallReadinessScore >= 0);
    assert.ok(typeof payload.launchDecision === "string");
    assert.ok(typeof payload.blockingCount === "number");
    assert.ok(payload.individualReadiness.payment >= 0);
  });

  it("integrates commerce readiness into Grand King dashboard", () => {
    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.commerceReadiness);
    assert.ok(dashboard.commerceReadiness!.overallReadinessScore >= 0);
    assert.ok(dashboard.commerceReadiness!.recommendedNextAction.length > 0);
    assert.ok(Array.isArray(dashboard.commerceReadiness!.blockingItems));
    assert.ok(Array.isArray(dashboard.commerceReadiness!.readyMarketplaces));
    assert.ok(Array.isArray(dashboard.commerceReadiness!.readyProducts));
    assert.ok(Array.isArray(dashboard.commerceReadiness!.readyBrands));
  });

  it("improves readiness when infrastructure and workflow progress", () => {
    connectLaunchInfrastructure();

    const started = startGrandKingsLaunchWorkflow({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandChoice: "Vennya Kitchen",
      category: "kitchen",
      actor: "founder@test.com",
    });
    runGrandKingsResearchPhase(started.workflowId);

    const evaluation = getCommerceReadinessEvaluation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(evaluation.individualReadiness.payment > 0);
    assert.ok(evaluation.individualReadiness.marketplaces > 0);
    assert.ok(evaluation.readyMarketplaces.includes("amazon"));
    assert.ok(
      evaluation.launchDecision === "NOT_READY" || evaluation.launchDecision === "READY_WITH_WARNINGS",
    );
  });

  it("delegates to Account and Marketplace engines without duplicating publishing logic", () => {
    const evaluation = getCommerceReadinessEvaluation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(evaluation.blockers.some((blocker) => blocker.category === "marketplaces" || blocker.category === "payment"));
    assert.ok(evaluation.blockers.some((blocker) => blocker.severity === "BLOCKING"));
    assert.equal(getCommerceReadinessSummary({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    }).launchDecision, evaluation.launchDecision);
  });

  it("blocks launch when approved products exist without certified CRIR (EI6-09)", () => {
    connectLaunchInfrastructure();

    const started = startGrandKingsLaunchWorkflow({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandChoice: "Vennya Kitchen",
      category: "kitchen",
      actor: "founder@test.com",
    });
    const researched = runGrandKingsResearchPhase(started.workflowId);
    assert.ok(researched.recommendations.length > 0);

    approveLaunchProducts({
      workflowId: started.workflowId,
      productIds: [researched.recommendations[0]!.productId],
      actor: "founder@test.com",
    });

    const evaluationBefore = getCommerceReadinessEvaluation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(
      evaluationBefore.blockers.some(
        (blocker) => blocker.id === "crir:missing" && blocker.severity === "BLOCKING",
      ),
    );

    registerCrirReport({
      reportId: "CRIR-2026-SA001-001",
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      supplierIds: [],
      marketplaceIds: [],
      preparedBy: "intelligence@test.com",
      preparedAt: new Date().toISOString(),
      certificationStatus: "GOVERNANCE_CERTIFIED",
      survivabilityAssessment: "PASS",
      sectionsComplete: true,
      version: "1.0",
    });

    const evaluationAfter = getCommerceReadinessEvaluation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.equal(evaluationAfter.individualReadiness.crir, 100);
    assert.ok(!evaluationAfter.blockers.some((blocker) => blocker.id === "crir:missing"));
  });

  it("blocks launch when CRIR survivability is FAIL", () => {
    registerCrirReport({
      reportId: "CRIR-2026-FAIL-001",
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      supplierIds: [],
      marketplaceIds: [],
      preparedBy: "intelligence@test.com",
      preparedAt: new Date().toISOString(),
      certificationStatus: "GOVERNANCE_CERTIFIED",
      survivabilityAssessment: "FAIL",
      sectionsComplete: true,
      version: "1.0",
    });

    const evaluation = getCommerceReadinessEvaluation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.ok(evaluation.blockers.some((blocker) => blocker.id === "crir:survivability-fail"));
    assert.equal(evaluation.individualReadiness.crir, 0);
    assert.equal(evaluation.launchDecision, "NOT_READY");
  });
});
