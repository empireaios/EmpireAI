import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionEngineRepository } from "../../orchestration/marketplace-connection-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import {
  resetProductDiscoveryRepository,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../../orchestration/product-discovery-opportunity-engine/index.js";
import {
  approveBusinessOpportunity,
  businessOpportunityWorkspaceTools,
  compareBusinessOpportunities,
  getApprovalHistory,
  listBusinessOpportunities,
  rejectBusinessOpportunity,
  resetBusinessOpportunityRepository,
  saveBusinessOpportunityForLater,
} from "../../orchestration/business-opportunity-workspace/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live006";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "business-opportunity-workspace",
    correlationId: "corr-live006",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = businessOpportunityWorkspaceTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

function seedDiscoverySessions(categories: string[] = ["kitchen", "beauty"]) {
  for (const category of categories) {
    const started = startProductDiscoverySession({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brand: `Grand King ${category}`,
      category,
      targetMarket: "US",
      existingSupplierNetwork: ["cj-dropshipping"],
      actor: "founder@test.com",
    });
    runProductDiscovery(started.sessionId);
  }
}

beforeEach(() => {
  configureValidationEnvironment();
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetProductDiscoveryRepository();
  resetBusinessOpportunityRepository();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-006 Business Opportunity Workspace", () => {
  it("registers six business workspace Brain tools", () => {
    assert.equal(businessOpportunityWorkspaceTools.length, 6);
    assert.ok(businessOpportunityWorkspaceTools.some((tool) => tool.name === "business_workspace.list"));
    assert.ok(businessOpportunityWorkspaceTools.some((tool) => tool.name === "business_workspace.compare"));
    assert.ok(businessOpportunityWorkspaceTools.some((tool) => tool.name === "business_workspace.approve"));
  });

  it("syncs discovery into investment-grade business opportunity cards", () => {
    seedDiscoverySessions();
    const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);

    assert.ok(opportunities.length > 0);
    const top = opportunities[0]!;
    assert.equal(top.status, "DISCOVERED");
    assert.ok(top.brand.businessName.length > 0);
    assert.ok(top.brand.logoPlaceholder.startsWith("placeholder://logo/"));
    assert.ok(top.brand.brandConfidence >= 0);
    assert.ok(top.economics.estimatedMargin >= 0);
    assert.ok(top.economics.expectedMonthlyRevenue > 0);
    assert.ok(top.economics.launchConfidence >= 0);
    assert.ok(top.assetsPreview.listingTitle.length > 0);
    assert.ok(top.assetsPreview.seoKeywords.length > 0);
    assert.ok(top.marketIntelligence.competitorSummary.length > 0);
    assert.ok(top.investmentThesis.includes("Would I invest"));
  });

  it("supports comparison mode with investment highlights", () => {
    seedDiscoverySessions();
    const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
    assert.ok(opportunities.length >= 2);

    const comparison = compareBusinessOpportunities(
      opportunities[0]!.businessOpportunityId,
      opportunities[1]!.businessOpportunityId,
    );

    assert.ok(comparison.highlights.betterMargin);
    assert.ok(comparison.highlights.betterSupplier);
    assert.ok(comparison.highlights.betterBrand);
    assert.ok(comparison.highlights.betterMarketplace);
    assert.ok(comparison.highlights.betterRoi);
    assert.ok(comparison.highlights.betterConfidence);
    assert.ok(comparison.summary.length > 0);
  });

  it("runs Grand King approve, reject, and save-for-later workflow with history", () => {
    seedDiscoverySessions();
    const opportunities = listBusinessOpportunities(WORKSPACE_ID, COMPANY_ID);
    const target = opportunities[0]!;

    const saved = saveBusinessOpportunityForLater(target.businessOpportunityId, "founder@test.com", "Review margins");
    assert.equal(saved.status, "UNDER_REVIEW");
    assert.equal(saved.favorite, true);
    assert.equal(saved.notes, "Review margins");

    const approved = approveBusinessOpportunity(target.businessOpportunityId, "founder@test.com");
    assert.ok(approved.status === "APPROVED" || approved.status === "READY_FOR_BUILD");

    const rejected = rejectBusinessOpportunity(
      opportunities[1]!.businessOpportunityId,
      "founder@test.com",
      "Low ROI",
    );
    assert.equal(rejected.status, "REJECTED");

    const history = getApprovalHistory(WORKSPACE_ID, COMPANY_ID);
    assert.ok(history.length >= 3);
    assert.ok(history.some((entry) => entry.action === "APPROVE"));
    assert.ok(history.some((entry) => entry.action === "REJECT"));
    assert.ok(history.some((entry) => entry.action === "SAVE_FOR_LATER"));
  });

  it("exposes business opportunity workspace on Grand King dashboard", () => {
    seedDiscoverySessions();
    const dashboard = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.ok(dashboard.businessOpportunityWorkspace);
    assert.ok(Array.isArray(dashboard.businessOpportunityWorkspace!.topOpportunities));
    assert.ok(dashboard.businessOpportunityWorkspace!.recommendedNextBusiness.length > 0);
    assert.ok(dashboard.businessOpportunityWorkspace!.highestDominationScore >= 0);
  });

  it("delegates to LIVE-005 discovery without publishing or execution", async () => {
    seedDiscoverySessions();
    const opportunities = await invokeTool("business_workspace.list");
    assert.ok(Array.isArray(opportunities));
    assert.ok((opportunities as unknown[]).length > 0);

    const compare = await invokeTool("business_workspace.compare", {
      opportunityA: (opportunities as { businessOpportunityId: string }[])[0]!.businessOpportunityId,
      opportunityB: (opportunities as { businessOpportunityId: string }[])[1]!.businessOpportunityId,
    });
    assert.ok((compare as { highlights: unknown }).highlights);
  });
});
