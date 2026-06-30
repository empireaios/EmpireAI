import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildProviderCapabilityMatrix,
  getProviderCapabilityMatrixEntry,
  CONNECTION_LIFECYCLE_TRANSITIONS,
  isOperationalLifecycleState,
  listApprovalPolicies,
  assessApprovalRequired,
  buildCredentialGovernanceSummary,
  verifyCredential,
  connectProvider,
  disconnectProvider,
  buildRealityReadinessDashboard,
  resetCredentialGovernanceAudit,
  resetCredentialVaultRepository,
  resetConnectorMonitoringRepository,
  resetConnectorRuntimeStates,
  storeConnectorCredential,
} from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-real-001";
const COMPANY_ID = "co-grand-king";

describe("Project Reality Phase 1 (REAL-001–REAL-005)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
    resetCredentialGovernanceAudit();
  });

  afterEach(() => {
    resetCredentialGovernanceAudit();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
    resetDatabaseInstance();
  });

  it("REAL-001 — provider capability matrix defines auth, scopes, rate limits, sandbox, and docs", () => {
    const matrix = buildProviderCapabilityMatrix();
    assert.ok(matrix.totalProviders >= 35);

    const shopify = getProviderCapabilityMatrixEntry("shopify");
    assert.ok(shopify);
    assert.equal(shopify!.supportsOAuth, true);
    assert.ok(shopify!.oauthScopes.length > 0);
    assert.ok(shopify!.rateLimitsPerMinute > 0);
    assert.ok(shopify!.documentationUrl.startsWith("https://"));
    assert.ok(shopify!.requiredBusinessVerification.length > 0);
    assert.equal(shopify!.sandboxAvailable, true);

    const stripe = getProviderCapabilityMatrixEntry("stripe");
    assert.ok(stripe!.supportsApiKey);
    assert.ok(stripe!.supportsWebhook);
  });

  it("REAL-002 — connection lifecycle standard covers all connector states", () => {
    assert.ok(CONNECTION_LIFECYCLE_TRANSITIONS.length >= 10);
    assert.ok(CONNECTION_LIFECYCLE_TRANSITIONS.some((t) => t.from === "CREDENTIALS_REQUIRED" && t.to === "CONNECTED"));
    assert.ok(CONNECTION_LIFECYCLE_TRANSITIONS.some((t) => t.from === "CONNECTED" && t.to === "VERIFIED"));
    assert.ok(CONNECTION_LIFECYCLE_TRANSITIONS.some((t) => t.to === "ACTIVE" && t.requiresHumanApproval));
    assert.equal(isOperationalLifecycleState("VERIFIED"), true);
    assert.equal(isOperationalLifecycleState("DISCOVERED"), false);
  });

  it("REAL-003 — irreversible actions require founder approval policies", () => {
    const policies = listApprovalPolicies();
    assert.ok(policies.length >= 10);

    const launchAds = assessApprovalRequired({
      workspaceId: WORKSPACE_ID,
      action: "launch_ads",
      providerId: "meta-ads",
    });
    assert.equal(launchAds.requiresHumanApproval, true);
    assert.equal(launchAds.riskLevel, "CRITICAL");

    const capture = assessApprovalRequired({
      workspaceId: WORKSPACE_ID,
      action: "capture_payment",
      providerId: "stripe",
    });
    assert.equal(capture.requiresHumanApproval, true);
    assert.equal(capture.approved, false);
  });

  it("REAL-004 — credential governance tracks rotation, expiry, verification, and audit", async () => {
    const record = storeConnectorCredential(WORKSPACE_ID, "stripe", "api_key", { apiKey: "sk_test" }, ["payments.read"]);
    const verification = verifyCredential(record.credentialsRef);
    assert.equal(verification.verified, true);

    const governance = buildCredentialGovernanceSummary(WORKSPACE_ID);
    assert.equal(governance.activeCredentials, 1);
    assert.ok(governance.records.length >= 1);
    assert.equal(governance.verifiedCredentials, 1);
  });

  it("REAL-005 — reality readiness dashboard exposes Mission Control payload", async () => {
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "shopify",
      credentialType: "oauth",
      secretPayload: { accessToken: "shopify-token" },
    });
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "stripe",
      credentialType: "api_key",
      secretPayload: { apiKey: "sk_test" },
    });
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "cj-dropshipping",
      credentialType: "api_key",
      secretPayload: { apiKey: "cj-key" },
    });

    const dashboard = buildRealityReadinessDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.moduleId, "reality-integration");
    assert.equal(dashboard.missionId, "REAL-001-REAL-005");
    assert.ok(dashboard.connectedProviders.length >= 3);
    assert.equal(dashboard.firstConnectedMarketplace, "shopify");
    assert.equal(dashboard.firstConnectedPayment, "stripe");
    assert.equal(dashboard.firstConnectedSupplier, "cj-dropshipping");
    assert.ok(dashboard.realCommerceReadinessPercent >= 90);
    assert.ok(dashboard.approvalQueue.length >= 10);

    await disconnectProvider(WORKSPACE_ID, "shopify");
    await disconnectProvider(WORKSPACE_ID, "stripe");
    await disconnectProvider(WORKSPACE_ID, "cj-dropshipping");
  });
});
