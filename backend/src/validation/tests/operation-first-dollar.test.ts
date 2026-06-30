import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionEngineRepository } from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import {
  approveBusinessOpportunity,
  listBusinessOpportunities,
  resetBusinessOpportunityRepository,
} from "../../orchestration/business-opportunity-workspace/index.js";
import {
  approveBusinessPreviewForBuild,
  generateBusinessPreviewForOpportunity,
  resetBusinessPreviewRepository,
} from "../../orchestration/business-preview-studio/index.js";
import {
  resetBusinessBuildRepository,
  startBusinessBuild,
} from "../../orchestration/business-build-engine/index.js";
import {
  resetBusinessSimulationRepository,
  runBusinessSimulationForBuild,
} from "../../orchestration/business-simulation-engine/index.js";
import {
  generateMarketStrategyForOpportunity,
  resetMarketStrategyRepository,
} from "../../orchestration/market-domination-strategy-engine/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import {
  REVENUE_OBJECTIVE_USD,
  buildLaunchCommandCenter,
  buildOperationFirstDollarDashboard,
  computeBusinessKpiSnapshot,
  createOperationFirstDollarModuleContract,
  generateDailyExecutiveBrief,
  getFirstDollarTrackerSummary,
  operationFirstDollarTools,
  OperationFirstDollarError,
  recordMilestone,
  recordRealBusinessEvent,
  resetOperationFirstDollarRepository,
  syncPipelineMilestones,
} from "../../operation-first-dollar/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-ofd001";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return { workspaceId: WORKSPACE_ID, agentId: "operation-first-dollar", correlationId: "corr-o001" };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = operationFirstDollarTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedPipeline() {
  const started = startProductDiscoverySession({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brand: "OFD Brand",
    category: "kitchen",
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    actor: "founder@test.com",
  });
  runProductDiscovery(started.sessionId);
  const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
  const target = opportunities[0]!;
  approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
  const preview = generateBusinessPreviewForOpportunity(target.businessOpportunityId);
  approveBusinessPreviewForBuild(preview.previewId, "founder@test.com");
  generateMarketStrategyForOpportunity(target.businessOpportunityId);
  const build = startBusinessBuild(target.businessOpportunityId, "founder@test.com");
  runBusinessSimulationForBuild(build.buildId);
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetOperationFirstDollarRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetBusinessPreviewRepository();
  resetMarketStrategyRepository();
  resetBusinessBuildRepository();
  resetBusinessSimulationRepository();
  resetOperationFirstDollarRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("O001 Operation First Dollar", () => {
  it("registers twelve Operation First Dollar Brain tools", () => {
    assert.equal(operationFirstDollarTools.length, 12);
    assert.ok(operationFirstDollarTools.some((t) => t.name === "ofd.launch_command_center"));
    assert.ok(operationFirstDollarTools.some((t) => t.name === "ofd.first_dollar_tracker"));
    assert.ok(operationFirstDollarTools.some((t) => t.name === "ofd.record_real_event"));
    assert.ok(operationFirstDollarTools.some((t) => t.name === "ofd.daily_executive_brief"));
    assert.ok(operationFirstDollarTools.some((t) => t.name === "ofd.dashboard"));
  });

  it("defines module contract with revenue objective and REAL protection", () => {
    const contract = createOperationFirstDollarModuleContract();
    assert.equal(contract.moduleId, "operation-first-dollar");
    assert.equal(contract.missionId, "O001");
    assert.equal(contract.revenueObjectiveUsd, REVENUE_OBJECTIVE_USD);
    assert.equal(contract.protection.noMockRevenue, true);
    assert.equal(contract.protection.noFakeOrders, true);
    assert.equal(contract.protection.noSimulatedProfitAsReal, true);
  });

  it("blocks SIMULATED source for REAL-only milestones", () => {
    assert.throws(
      () =>
        recordMilestone({
          workspaceId: WORKSPACE_ID,
          companyId: COMPANY_ID,
          milestone: "FIRST_SALE",
          source: "SIMULATED",
        }),
      OperationFirstDollarError,
    );
  });

  it("requires externalReference for REAL-only milestones", () => {
    assert.throws(
      () =>
        recordMilestone({
          workspaceId: WORKSPACE_ID,
          companyId: COMPANY_ID,
          milestone: "FIRST_SALE",
          source: "REAL",
        }),
      OperationFirstDollarError,
    );
  });

  it("syncs pipeline milestones after product approval", () => {
    seedPipeline();
    const synced = syncPipelineMilestones(WORKSPACE_ID, COMPANY_ID);
    assert.ok(synced.some((m) => m.milestone === "FIRST_PRODUCT_SELECTED"));
    const tracker = getFirstDollarTrackerSummary(WORKSPACE_ID, COMPANY_ID);
    assert.ok(tracker.achievedCount >= 1);
    assert.equal(tracker.totalCount, 10);
  });

  it("computes KPI with SIMULATED forecast when no real sale exists", () => {
    seedPipeline();
    const kpi = computeBusinessKpiSnapshot(WORKSPACE_ID, COMPANY_ID);
    assert.equal(kpi.revenue.source, "SIMULATED");
    assert.equal(kpi.profit.source, "SIMULATED");
    assert.equal(kpi.orders.source, "REAL");
    assert.equal(kpi.orders.value, 0);
  });

  it("records verified real sale with REAL revenue", () => {
    seedPipeline();
    const result = recordRealBusinessEvent({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      eventType: "sale",
      amountUsd: 29.99,
      externalReference: "stripe:pi_test_001",
      evidence: "First verified Stripe payment",
    });
    assert.ok(result.milestone);
    assert.equal(result.milestone!.milestone, "FIRST_SALE");
    assert.equal(result.kpi.revenue.source, "REAL");
    assert.equal(result.kpi.revenue.value, 29.99);
  });

  it("generates daily executive brief", () => {
    seedPipeline();
    const brief = generateDailyExecutiveBrief(WORKSPACE_ID, COMPANY_ID);
    assert.ok(brief.whatHappenedYesterday.length > 0);
    assert.ok(brief.todaysHighestPriority.length > 0);
    assert.ok(brief.grandKingActionsToday.length >= 1);
    assert.equal(brief.source, "REAL");
  });

  it("builds launch command center with revenue objective", () => {
    seedPipeline();
    const center = buildLaunchCommandCenter(WORKSPACE_ID, COMPANY_ID);
    assert.equal(center.revenueObjectiveUsd, 100_000);
    assert.ok(center.dailyPriorities.length >= 1);
    assert.ok(["PRE_LAUNCH", "LAUNCH_PREP", "LIVE_TRADING"].includes(center.currentPhase));
  });

  it("builds Operation First Dollar dashboard", async () => {
    seedPipeline();
    const dashboard = buildOperationFirstDollarDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.status.length > 0);
    assert.ok(dashboard.nextCriticalAction.length > 0);
    assert.equal(dashboard.milestonesTotal, 10);
    assert.ok(["REAL", "SIMULATED"].includes(dashboard.revenueToday.source));
  });

  it("integrates with Grand King's Dashboard", () => {
    seedPipeline();
    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.operationFirstDollar);
    assert.equal(dashboard.operationFirstDollar!.milestonesTotal, 10);
    assert.ok(dashboard.operationFirstDollar!.nextCriticalAction.length > 0);
  });

  it("invokes Brain tools end-to-end", async () => {
    seedPipeline();
    const tracker = await invokeTool("ofd.first_dollar_tracker");
    assert.ok((tracker as { achievedCount: number }).achievedCount >= 1);
    const brief = await invokeTool("ofd.daily_executive_brief");
    assert.ok((brief as { todaysHighestPriority: string }).todaysHighestPriority.length > 0);
  });
});
