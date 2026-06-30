import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  completeMarketplaceConnectionFlow,
  getMarketplaceConnectionRecord,
  getMarketplacePublishingReadiness,
  listMarketplaceConnectionRecords,
  marketplaceConnectionTools,
  resetMarketplaceConnectionEngineRepository,
  startMarketplaceConnectionFlow,
  verifyMarketplaceConnectionFlow,
} from "../../orchestration/marketplace-connection-engine/index.js";
import { resetAccountInfrastructureRepository } from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import { getMarketplacePublishingReadinessForLaunch } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import { MARKETPLACE_IDS } from "../../orchestration/marketplace-infrastructure-engine/models/marketplace-connection.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live003";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "marketplace-connection-engine",
    correlationId: "corr-live003",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = marketplaceConnectionTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
});

afterEach(() => {
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetMarketplaceConnectionEngineRepository();
  resetDatabaseInstance();
});

describe("LIVE-003 Marketplace Connection Engine", () => {
  it("registers eight marketplace connection Brain tools", () => {
    assert.equal(marketplaceConnectionTools.length, 8);
    assert.ok(marketplaceConnectionTools.some((tool) => tool.name === "marketplace_connection.list"));
    assert.ok(marketplaceConnectionTools.some((tool) => tool.name === "marketplace_connection.readiness"));
  });

  it("lists all eight supported marketplace connection records", () => {
    const records = listMarketplaceConnectionRecords(WORKSPACE_ID);
    assert.equal(records.length, 8);
    for (const marketplaceId of MARKETPLACE_IDS) {
      assert.ok(records.some((entry) => entry.marketplaceId === marketplaceId));
    }
  });

  it("models required connection fields for each marketplace", () => {
    const records = listMarketplaceConnectionRecords(WORKSPACE_ID);
    for (const record of records) {
      assert.equal(record.accountType, "GRAND_KING");
      assert.ok(typeof record.connectionStatus === "string");
      assert.ok(typeof record.connectionHealth === "string");
      assert.ok(typeof record.oauthStatus === "string");
      assert.ok(typeof record.apiStatus === "string");
      assert.ok(typeof record.permissionStatus === "string");
      assert.ok(Array.isArray(record.requiredScopes));
      assert.ok(Array.isArray(record.grantedScopes));
      assert.ok(Array.isArray(record.missingScopes));
      assert.ok(Array.isArray(record.setupSteps));
      assert.ok(Array.isArray(record.requiredHumanSteps));
      assert.ok(typeof record.notes === "string");
      assert.ok(typeof record.oauthSupported === "boolean");
      assert.ok(typeof record.apiKeySupported === "boolean");
      assert.ok(typeof record.manualSetupRequired === "boolean");
      assert.ok(record.metadata.neverStoresPasswords === "true");
    }
  });

  it("implements OAuth/API blueprint start and complete without passwords", () => {
    const started = startMarketplaceConnectionFlow({
      workspaceId: WORKSPACE_ID,
      marketplaceId: "shopify",
      accountType: "GRAND_KING",
      actor: "founder@test.com",
    });
    assert.ok(
      started.connectionStatus === "CONNECTING" || started.connectionStatus === "AWAITING_USER_ACTION",
    );

    const completed = completeMarketplaceConnectionFlow({
      workspaceId: WORKSPACE_ID,
      marketplaceId: "shopify",
      credentialsRef: "vault:shopify:live003",
      actor: "founder@test.com",
    });
    assert.equal(completed.connectionStatus, "CONNECTED");
    assert.equal(completed.credentialsRef, "vault:shopify:live003");
    assert.ok(!completed.credentialsRef?.includes("password"));
    assert.equal(completed.oauthStatus, "AUTHORIZED");
    assert.equal(completed.missingScopes.length, 0);
  });

  it("queues human setup steps via Account Infrastructure Engine delegation", () => {
    const record = getMarketplaceConnectionRecord(WORKSPACE_ID, "amazon");
    assert.ok(record.requiredHumanSteps.length > 0);
    assert.ok(record.manualSetupRequired);
    assert.ok(record.pendingHumanActions >= 0);
  });

  it("returns publishing readiness for Commerce Orchestrator", () => {
    completeMarketplaceConnectionFlow({
      workspaceId: WORKSPACE_ID,
      marketplaceId: "ebay",
      credentialsRef: "vault:ebay:live003",
      actor: "founder@test.com",
    });

    const readiness = getMarketplacePublishingReadiness(WORKSPACE_ID);
    assert.ok(Array.isArray(readiness.readyMarketplaces));
    assert.ok(Array.isArray(readiness.blockedMarketplaces));
    assert.ok(Array.isArray(readiness.actionRequiredMarketplaces));
    assert.ok(readiness.overallMarketplaceReadiness >= 0 && readiness.overallMarketplaceReadiness <= 100);
    assert.ok(readiness.readyMarketplaces.includes("ebay"));

    const orchestratorReadiness = getMarketplacePublishingReadinessForLaunch(WORKSPACE_ID);
    assert.equal(orchestratorReadiness.overallMarketplaceReadiness, readiness.overallMarketplaceReadiness);
  });

  it("supports verify and refresh blueprint operations", async () => {
    completeMarketplaceConnectionFlow({
      workspaceId: WORKSPACE_ID,
      marketplaceId: "walmart",
      credentialsRef: "vault:walmart:live003",
    });

    const verified = verifyMarketplaceConnectionFlow({
      workspaceId: WORKSPACE_ID,
      marketplaceId: "walmart",
    });
    assert.ok(verified.lastVerifiedAt);
    assert.equal(verified.apiStatus, "VERIFIED");

    const refreshed = await invokeTool("marketplace_connection.refresh", { marketplaceId: "walmart" });
    assert.ok((refreshed as { lastVerifiedAt?: string }).lastVerifiedAt);
  });

  it("declares unsupported automation areas including live publishing", () => {
    const record = getMarketplaceConnectionRecord(WORKSPACE_ID, "amazon");
    assert.ok(record.unsupportedAutomationAreas.includes("live_publishing"));
    assert.ok(record.unsupportedAutomationAreas.includes("product_creation"));
    assert.ok(record.unsupportedAutomationAreas.includes("ad_launch"));
  });

  it("uses vault references via connector catalog without plaintext credentials", () => {
    const connectorRepo = new ConnectorConnectionRepository();
    connectorRepo.upsert({
      workspaceId: WORKSPACE_ID,
      connectorId: "amazon",
      category: "commerce",
      status: "connected",
      credentialsRef: "vault:amazon:live003",
      metadata: { oauth: true },
    });

    completeMarketplaceConnectionFlow({
      workspaceId: WORKSPACE_ID,
      marketplaceId: "amazon",
      credentialsRef: "vault:amazon:live003",
    });

    const record = getMarketplaceConnectionRecord(WORKSPACE_ID, "amazon");
    assert.equal(record.credentialsRef, "vault:amazon:live003");
    assert.ok(!record.credentialsRef?.startsWith("sk_"));
  });
});
