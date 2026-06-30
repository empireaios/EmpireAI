import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  ACCOUNT_PROVIDER_IDS,
  accountInfrastructureTools,
  completeAccountConnection,
  formatReadinessSummaryText,
  getAccountReadiness,
  getExternalAccount,
  listExternalAccounts,
  listHumanActionQueue,
  resetAccountInfrastructureRepository,
  startAccountSetup,
} from "../../orchestration/account-infrastructure-engine/index.js";
import { resetMarketplaceConnectionRepository } from "../../orchestration/marketplace-infrastructure-engine/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-live002";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "account-infrastructure-engine",
    correlationId: "corr-live002",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = accountInfrastructureTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
});

afterEach(() => {
  resetAccountInfrastructureRepository();
  resetMarketplaceConnectionRepository();
  resetDatabaseInstance();
});

describe("LIVE-002 Account Infrastructure Engine", () => {
  it("registers seven account infrastructure Brain tools", () => {
    assert.equal(accountInfrastructureTools.length, 7);
    assert.ok(accountInfrastructureTools.some((tool) => tool.name === "account_infrastructure.list"));
    assert.ok(accountInfrastructureTools.some((tool) => tool.name === "account_infrastructure.readiness"));
  });

  it("lists all ten supported external account providers", () => {
    const accounts = listExternalAccounts(WORKSPACE_ID);
    assert.equal(accounts.length, 10);
    for (const providerId of ACCOUNT_PROVIDER_IDS) {
      assert.ok(accounts.some((entry) => entry.providerId === providerId));
    }
  });

  it("exposes required provider fields on every account", () => {
    const accounts = listExternalAccounts(WORKSPACE_ID);
    for (const account of accounts) {
      assert.ok(typeof account.connectionStatus === "string");
      assert.ok(typeof account.connectionHealth === "string");
      assert.ok(Array.isArray(account.requiredPermissions));
      assert.ok(typeof account.oauthSupported === "boolean");
      assert.ok(typeof account.apiSupported === "boolean");
      assert.ok(Array.isArray(account.requiredHumanSteps));
      assert.ok(typeof account.expiryStatus === "string");
      assert.ok(typeof account.notes === "string");
      assert.ok(account.metadata.neverStoresPasswords === "true");
    }
  });

  it("supports account lifecycle statuses including AWAITING_USER_ACTION", () => {
    const account = startAccountSetup(WORKSPACE_ID, "stripe", "founder@test.com");
    assert.equal(account.connectionStatus, "PENDING_SETUP");

    const actions = listHumanActionQueue(WORKSPACE_ID, { providerId: "stripe" });
    assert.ok(actions.length > 0);

    const refreshed = getExternalAccount(WORKSPACE_ID, "stripe");
    assert.ok(
      refreshed.connectionStatus === "PENDING_SETUP" ||
        refreshed.connectionStatus === "AWAITING_USER_ACTION",
    );
  });

  it("computes account health with blocking issues for disconnected accounts", () => {
    const snapshot = invokeTool("account_infrastructure.get", { providerId: "amazon-seller" });
    return snapshot.then((result) => {
      const payload = result as { health: { healthScore: number; blockingIssues: string[] } };
      assert.ok(payload.health.healthScore >= 0 && payload.health.healthScore <= 100);
      assert.ok(payload.health.blockingIssues.length > 0);
    });
  });

  it("queues human-only actions and never bypasses them", () => {
    listExternalAccounts(WORKSPACE_ID);
    const actions = listHumanActionQueue(WORKSPACE_ID);
    assert.ok(actions.length > 0);
    for (const action of actions) {
      assert.ok(action.title.length > 0);
      assert.ok(action.description.includes("EA cannot bypass"));
      assert.ok(action.blockingOperations.length > 0);
    }
  });

  it("returns unified readiness summary with overall percentage", () => {
    const summary = getAccountReadiness(WORKSPACE_ID);
    assert.equal(summary.lines.length, 10);
    assert.ok(summary.overallReadinessPercent >= 0 && summary.overallReadinessPercent <= 100);
    assert.ok(summary.computedAt);

    const formatted = formatReadinessSummaryText(summary);
    assert.ok(formatted.includes("Overall Readiness:"));
    assert.ok(formatted.includes("%"));
  });

  it("marks account connected via OAuth credentials ref without passwords", async () => {
    const connectorRepo = new ConnectorConnectionRepository();
    connectorRepo.upsert({
      workspaceId: WORKSPACE_ID,
      connectorId: "stripe",
      category: "payments",
      status: "connected",
      credentialsRef: "vault:stripe:live002",
      metadata: { oauth: true },
    });

    const connected = completeAccountConnection(WORKSPACE_ID, "stripe", {
      credentialsRef: "vault:stripe:live002",
      actor: "founder@test.com",
    });

    assert.equal(connected.connectionStatus, "CONNECTED");
    assert.equal(connected.credentialsRef, "vault:stripe:live002");
    assert.ok(connected.healthScore >= 70);

    const summary = getAccountReadiness(WORKSPACE_ID);
    const stripeLine = summary.lines.find((line) => line.providerId === "stripe");
    assert.ok(stripeLine);
    assert.equal(stripeLine!.label, "READY");
  });

  it("delegates marketplace providers to marketplace infrastructure without duplicating publishing logic", async () => {
    const registry = await invokeTool("account_infrastructure.provider_registry");
    const amazon = (registry as Record<string, { marketplaceId?: string }>)["amazon-seller"];
    assert.equal(amazon?.marketplaceId, "amazon");

    const account = getExternalAccount(WORKSPACE_ID, "amazon-seller");
    assert.equal(account.metadata.marketplaceId, "amazon");
  });
});
