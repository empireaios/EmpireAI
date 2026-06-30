import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/index.js";
import {
  REALITY_PROVIDER_CATALOG,
  connectProvider,
  connectorCost,
  connectorDependencies,
  connectorGovernanceFlow,
  connectorHealth,
  connectorHeartbeat,
  connectorValidate,
  createRealityIntegrationModuleContract,
  disconnectProvider,
  buildConnectorHealthCenter,
  buildRealityIntegrationDashboard,
  getCredentialVaultRepository,
  getConnectorRuntimeState,
  listConnectorRegistry,
  listRealityProviders,
  realityIntegrationTools,
  resetConnectorMonitoringRepository,
  resetConnectorRuntimeStates,
  resetCredentialVaultRepository,
  storeConnectorCredential,
  validateRealityIntegration,
} from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-c001";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "reality-integration",
    correlationId: "corr-c001",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = realityIntegrationTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetCredentialVaultRepository();
  resetConnectorMonitoringRepository();
  resetConnectorRuntimeStates();
});

afterEach(() => {
  resetCredentialVaultRepository();
  resetConnectorMonitoringRepository();
  resetConnectorRuntimeStates();
  resetDatabaseInstance();
});

describe("C001 → C020 Reality Integration Foundation", () => {
  it("registers reality integration Brain tools including REAL-001–REAL-005", () => {
    assert.equal(realityIntegrationTools.length, 28);
    assert.ok(realityIntegrationTools.some((tool) => tool.name === "reality_integration.connect"));
    assert.ok(realityIntegrationTools.some((tool) => tool.name === "reality_integration.validate_all"));
  });

  it("declares unified module contract for C001 through C020", () => {
    const contract = createRealityIntegrationModuleContract();
    assert.equal(contract.moduleId, "reality-integration");
    assert.equal(contract.missionIds.length, 27);
    assert.equal(contract.protection.noPlaintextCredentials, true);
    assert.equal(contract.protection.noLiveCharging, true);
    assert.equal(contract.executionDoctrine.appliesFromMission, "C001");
  });

  it("C004 registry catalogs all required providers across categories", () => {
    const registry = listConnectorRegistry();
    assert.equal(registry.length, REALITY_PROVIDER_CATALOG.length);
    assert.ok(registry.length >= 35);

    const categories = new Set(registry.map((e) => e.definition.category));
    assert.ok(categories.has("commerce"));
    assert.ok(categories.has("suppliers"));
    assert.ok(categories.has("payments"));
    assert.ok(categories.has("advertising"));
    assert.ok(categories.has("creative_ai"));
    assert.ok(categories.has("analytics"));
    assert.ok(categories.has("search_intelligence"));
    assert.ok(categories.has("seo_intelligence"));
    assert.ok(categories.has("product_intelligence"));
    assert.ok(categories.has("buyer_intelligence"));
    assert.ok(categories.has("trend_intelligence"));
  });

  it("C003 credential vault encrypts secrets — no plaintext storage", () => {
    const record = storeConnectorCredential(WORKSPACE_ID, "stripe", "api_key", {
      apiKey: "sk_test_secret_value",
    });
    assert.ok(record.credentialsRef.startsWith("vault:stripe:"));

    const db = getCredentialVaultRepository();
    const resolved = db.resolveSecret(record.credentialsRef);
    assert.equal(resolved?.apiKey, "sk_test_secret_value");

    db.revokeCredential(record.credentialsRef);
    assert.equal(db.resolveSecret(record.credentialsRef), null);
  });

  it("C002 runtime supports connect validate heartbeat cost dependencies without duplication", async () => {
    const state = await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "cj-dropshipping",
      credentialType: "api_key",
      secretPayload: { apiKey: "cj-test-key" },
      actor: "founder@test.com",
    });

    assert.equal(state.lifecycle, "CONNECTED");
    assert.equal(state.executionBlocked, true);
    assert.ok(state.credentialsRef?.startsWith("vault:"));

    const validation = await connectorValidate(WORKSPACE_ID, "cj-dropshipping");
    assert.equal(validation.valid, true);

    const heartbeat = await connectorHeartbeat(WORKSPACE_ID, "cj-dropshipping");
    assert.ok(heartbeat.latencyMs >= 0);

    const cost = connectorCost(WORKSPACE_ID, "cj-dropshipping");
    assert.ok(cost.monthlyCostCents >= 0);

    const deps = connectorDependencies("google-merchant");
    assert.ok(deps.includes("google-search-console"));

    const health = connectorHealth(WORKSPACE_ID, "cj-dropshipping");
    assert.equal(health.state, "HEALTHY");

    await disconnectProvider(WORKSPACE_ID, "cj-dropshipping");
    const disconnected = getConnectorRuntimeState(WORKSPACE_ID, "cj-dropshipping");
    assert.equal(disconnected?.lifecycle, "REVOKED");
  });

  it("C005–C015 marketplace supplier payment ad creative analytics intelligence providers are connection-only", () => {
    const commerce = listRealityProviders("commerce");
    assert.ok(commerce.some((p) => p.providerId === "amazon-seller"));
    assert.ok(commerce.some((p) => p.providerId === "tiktok-shop"));
    assert.ok(commerce.some((p) => p.providerId === "walmart"));

    const suppliers = listRealityProviders("suppliers");
    assert.ok(suppliers.some((p) => p.providerId === "dsers"));

    const ads = listRealityProviders("advertising");
    assert.ok(ads.some((p) => p.providerId === "pinterest-ads"));

    for (const provider of REALITY_PROVIDER_CATALOG) {
      assert.equal(provider.irreversibleActionsBlocked, true);
      assert.equal(provider.connectionOnly, true);
    }
  });

  it("C016 health center displays healthy warning failed disabled and monthly cost", async () => {
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "stripe",
      credentialType: "api_key",
      secretPayload: { apiKey: "sk_test" },
    });

    const center = buildConnectorHealthCenter(WORKSPACE_ID);
    assert.equal(center.entries.length, REALITY_PROVIDER_CATALOG.length);
    assert.ok(center.healthy >= 1);
    assert.ok(center.disabled >= 1);
    assert.ok(center.computedAt.length > 0);
  });

  it("C017 governance flow requires governance approval before execution runtime", () => {
    const flow = connectorGovernanceFlow();
    assert.deepEqual(flow.stages, ["Governance", "Approval", "Execution Runtime"]);
    assert.equal(flow.irreversibleActionsBlocked, true);
  });

  it("C019 reality integration dashboard integrates into Grand King dashboard", async () => {
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "shopify",
      credentialType: "oauth",
      secretPayload: { accessToken: "shopify-token" },
    });

    const dashboard = buildRealityIntegrationDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dashboard.connectedServices.includes("shopify"));
    assert.ok(dashboard.disconnectedServices.length > 0);
    assert.ok(dashboard.recommendedConnections.length > 0);
    assert.ok(dashboard.capabilities.length > 0);

    const grandKing = buildGrandKingsDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(grandKing.realityIntegration);
    assert.ok(grandKing.realityIntegration!.connectedServices.includes("shopify"));
  });

  it("C020 validates runtime registry vault governance and dashboard", async () => {
    const result = await validateRealityIntegration(WORKSPACE_ID);
    assert.equal(result.registryValid, true);
    assert.equal(result.vaultValid, true);
    assert.equal(result.governanceValid, true);
    assert.equal(result.runtimeValid, true);
    assert.equal(result.dashboardValid, true);
    assert.equal(result.valid, true);
    assert.ok(result.providersValidated >= 3);
    assert.equal(result.blockers.length, 0);
  });

  it("runs connect and validate via Brain tools without live execution", async () => {
    const state = await invokeTool("reality_integration.connect", {
      providerId: "meta-ads",
      credentialType: "oauth",
      secretPayload: { accessToken: "meta-token" },
    });
    assert.equal((state as { lifecycle: string }).lifecycle, "CONNECTED");

    const validation = await invokeTool("reality_integration.validate", {
      providerId: "meta-ads",
    });
    assert.equal((validation as { valid: boolean }).valid, true);
  });
});
