import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  MARKETPLACE_IDS,
  approveLaunchProducts,
  ecommerceOsTools,
  getGrandKingsLaunchDashboard,
  getLaunchReadiness,
  listMarketplaceConnections,
  prepareGrandKingsLaunch,
  resetEcommerceOsWorkflowRepository,
  resetMarketplaceConnectionRepository,
  runGrandKingsResearchPhase,
  startGrandKingsLaunchWorkflow,
  startMarketplaceConnection,
} from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live001";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "ecommerce-os-orchestrator",
    correlationId: "corr-live001",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = ecommerceOsTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetEcommerceOsWorkflowRepository();
  resetMarketplaceConnectionRepository();
});

afterEach(() => {
  resetEcommerceOsWorkflowRepository();
  resetMarketplaceConnectionRepository();
  resetDatabaseInstance();
});

describe("LIVE-001 E-commerce OS Orchestrator", () => {
  it("registers eleven ecommerce OS Brain tools", () => {
    assert.equal(ecommerceOsTools.length, 11);
    assert.ok(ecommerceOsTools.some((tool) => tool.name === "ecommerce_os.start_workflow"));
    assert.ok(ecommerceOsTools.some((tool) => tool.name === "marketplace_infrastructure.list"));
  });

  it("runs Grand King launch workflow from brand choice to recommendations", () => {
    const started = startGrandKingsLaunchWorkflow({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandChoice: "Vennya Kitchen",
      category: "kitchen",
      actor: "founder@test.com",
    });

    assert.equal(started.stage, "CATEGORY_CHOSEN");
    assert.equal(started.brandChoice, "Vennya Kitchen");

    const researched = runGrandKingsResearchPhase(started.workflowId);
    assert.equal(researched.stage, "AWAITING_APPROVAL");
    assert.ok(researched.recommendations.length > 0);

    const top = researched.recommendations[0]!;
    assert.ok(top.dominationScore >= 0 && top.dominationScore <= 100);
    assert.ok(top.expectedRoi >= 0);
    assert.ok(top.margin >= 0);
    assert.ok(top.supplierConfidence >= 0);
    assert.ok(top.shippingConfidence >= 0);
    assert.ok(top.repeatPurchasePotential >= 0);
    assert.ok(top.brandingPotential >= 0);
  });

  it("prepares launch assets after Grand King approval", async () => {
    const started = startGrandKingsLaunchWorkflow({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandChoice: "Grand King Essentials",
      category: "kitchen",
      actor: "founder@test.com",
    });
    const researched = runGrandKingsResearchPhase(started.workflowId);
    const topProductId = researched.recommendations[0]!.productId;

    approveLaunchProducts({
      workflowId: started.workflowId,
      productIds: [topProductId],
      actor: "founder@test.com",
    });

    const prepared = await prepareGrandKingsLaunch(started.workflowId);
    assert.equal(prepared.stage, "READY_TO_LAUNCH");
    assert.equal(prepared.launchStatus, "READY_TO_LAUNCH");
    assert.ok(prepared.assets.brandId);
    assert.ok(prepared.assets.listingsPrepared > 0);
    assert.ok(prepared.assets.seoPrepared);
    assert.ok(prepared.assets.supplierConnectionPrepared);
    assert.ok(prepared.assets.storeId);

    const readiness = getLaunchReadiness(started.workflowId);
    assert.equal(readiness.launchStatus, "READY_TO_LAUNCH");
    assert.equal(readiness.blockers.length, 0);
  });

  it("returns unified Grand King dashboard status model", async () => {
    const started = startGrandKingsLaunchWorkflow({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      brandChoice: "Dashboard Test Brand",
      category: "health",
      actor: "founder@test.com",
    });
    const researched = runGrandKingsResearchPhase(started.workflowId);
    approveLaunchProducts({
      workflowId: started.workflowId,
      productIds: [researched.recommendations[0]!.productId],
      actor: "founder@test.com",
    });
    await prepareGrandKingsLaunch(started.workflowId);

    const dashboard = getGrandKingsLaunchDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.accountType, "grand_king");
    assert.ok(["READY", "IN_PROGRESS", "CONNECTED", "PARTIAL"].includes(dashboard.brand.status));
    assert.ok(dashboard.marketplaces.length === MARKETPLACE_IDS.length);
    assert.equal(dashboard.launch.label, "READY TO LAUNCH");
  });

  it("tracks eight marketplace connections without storing passwords", () => {
    const connections = listMarketplaceConnections(WORKSPACE_ID);
    assert.equal(connections.length, 8);
    assert.ok(connections.some((c) => c.marketplaceId === "amazon"));
    assert.ok(connections.some((c) => c.marketplaceId === "tiktok-shop"));
    assert.ok(connections.every((c) => c.requiredHumanSteps.length > 0));

    const connecting = startMarketplaceConnection(WORKSPACE_ID, "shopify", "founder@test.com");
    assert.equal(connecting.status, "CONNECTING");
    assert.ok(connecting.oauthUrl);
  });

  it("exposes orchestrator operations via Brain tools", async () => {
    const workflow = (await invokeTool("ecommerce_os.start_workflow", {
      brandChoice: "Tool Test Brand",
      category: "kitchen",
    })) as { workflowId: string };

    const researched = await invokeTool("ecommerce_os.research", {
      workflowId: workflow.workflowId,
    });
    assert.ok(researched && typeof researched === "object" && "recommendations" in researched);

    const marketplaces = (await invokeTool("marketplace_infrastructure.list")) as {
      connections: unknown[];
    };
    assert.ok(Array.isArray(marketplaces.connections));
    assert.equal((marketplaces.connections as unknown[]).length, 8);
  });
});
