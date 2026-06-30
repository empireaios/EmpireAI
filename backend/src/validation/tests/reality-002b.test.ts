import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  assessLiveCommerceGoLive,
  buildLiveCommerceIntegrationDashboard,
  connectLiveCommerceProvider,
  connectorValidate,
  processLiveCommerceWebhook,
  recoverFailedLiveCommerceOperation,
  resetConnectorRuntimeStates,
  resetCredentialGovernanceAudit,
  resetCredentialVaultRepository,
  resetConnectorMonitoringRepository,
  resetLiveCommerceRepository,
  resetHttpTransportOverride,
  runLiveCommerceSecurityReview,
  runLiveCommerceSync,
  startMarketplaceOAuth,
  completeMarketplaceOAuth,
  validateLiveMarketplaceConnection,
} from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-real-002b";

describe("REAL-002B — Live Commerce Integration", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    process.env.LIVE_COMMERCE_INTEGRATION_MODE = "sandbox";
    resetDatabaseInstance();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
    resetCredentialGovernanceAudit();
    resetLiveCommerceRepository();
    resetHttpTransportOverride();
  });

  afterEach(() => {
    resetHttpTransportOverride();
    resetLiveCommerceRepository();
    resetConnectorRuntimeStates();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetCredentialGovernanceAudit();
    resetDatabaseInstance();
  });

  it("REAL-002B — live commerce integration dashboard reports REAL-002B mission", () => {
    const dashboard = buildLiveCommerceIntegrationDashboard(WORKSPACE_ID);
    assert.equal(dashboard.missionId, "REAL-002B");
    assert.equal(dashboard.liveIntegrationEnabled, true);
    assert.equal(dashboard.mode, "sandbox");
    assert.ok(dashboard.marketplaceProviders.some((p) => p.providerId === "amazon-seller"));
    assert.ok(dashboard.supplierProviders.some((p) => p.providerId === "cj-dropshipping"));
  });

  it("REAL-002B — OAuth lifecycle start and complete", async () => {
    const started = startMarketplaceOAuth({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      redirectUri: "https://empire.local/oauth/callback",
    });
    assert.ok(started.authorizationUrl.includes("amazon"));
    assert.equal(started.state.status, "pending");

    const completed = await completeMarketplaceOAuth({
      stateId: started.stateId,
      code: "auth-code-12345678",
    });
    assert.equal(completed.state.status, "completed");
    assert.ok(completed.tokens.accessToken);
  });

  it("REAL-002B — marketplace validation requires credentials then verifies in sandbox", async () => {
    const blocked = await validateLiveMarketplaceConnection(WORKSPACE_ID, "amazon-seller");
    assert.equal(blocked.valid, false);

    await connectLiveCommerceProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      credentialType: "oauth",
      secretPayload: { accessToken: "live-amazon-token", refreshToken: "live-amazon-refresh" },
      scopes: ["sellingpartnerapi::notifications"],
    });

    const validated = await validateLiveMarketplaceConnection(WORKSPACE_ID, "amazon-seller");
    assert.equal(validated.valid, true);
    assert.equal(validated.liveApiVerified, true);

    const connectorResult = await connectorValidate(WORKSPACE_ID, "amazon-seller");
    assert.equal(connectorResult.valid, true);
  });

  it("REAL-002B — supplier authentication and sync operations", async () => {
    await connectLiveCommerceProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "cj-dropshipping",
      credentialType: "api_key",
      secretPayload: { apiKey: "cj-live-key" },
    });

    for (const syncType of ["catalog", "inventory", "pricing", "orders"] as const) {
      const job = await runLiveCommerceSync({
        workspaceId: WORKSPACE_ID,
        providerId: "cj-dropshipping",
        syncType,
      });
      assert.equal(job.status, "completed");
      assert.ok(job.itemsProcessed > 0);
      assert.equal(job.mode, "sandbox");
    }
  });

  it("REAL-002B — webhook processing validates signature and dead-letters invalid", () => {
    const payload = JSON.stringify({ orderId: "ORD-001" });
    const secret = "webhook-secret";
    const signature = createHmac("sha256", secret).update(payload).digest("hex");

    const valid = processLiveCommerceWebhook({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      topic: "ORDER_CHANGE",
      payload,
      signature,
      secret,
    });
    assert.equal(valid.status, "processed");
    assert.equal(valid.signatureValid, true);

    const invalid = processLiveCommerceWebhook({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      topic: "ORDER_CHANGE",
      payload,
      signature: "bad-signature",
      secret,
    });
    assert.equal(invalid.status, "dead_letter");
  });

  it("REAL-002B — failure recovery retries failed sync operations", async () => {
    await connectLiveCommerceProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      credentialType: "oauth",
      secretPayload: { accessToken: "token" },
    });

    const repo = (await import(
      "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js"
    )).getLiveCommerceRepository();
    const recoveryId = repo.createRecoveryRecord({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      operation: "sync.catalog",
      errorMessage: "Simulated failure",
    });

    const recovered = await recoverFailedLiveCommerceOperation({
      workspaceId: WORKSPACE_ID,
      recoveryId,
    });
    assert.equal(recovered.recovered, true);
  });

  it("REAL-002B — security review and go-live assessment", async () => {
    await connectLiveCommerceProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      credentialType: "oauth",
      secretPayload: { accessToken: "token", refreshToken: "refresh" },
    });
    await connectLiveCommerceProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "cj-dropshipping",
      credentialType: "api_key",
      secretPayload: { apiKey: "cj-key" },
    });

    const security = runLiveCommerceSecurityReview(WORKSPACE_ID, "amazon-seller");
    assert.equal(security.passed, true);

    for (const syncType of ["catalog", "inventory", "pricing", "orders"] as const) {
      await runLiveCommerceSync({
        workspaceId: WORKSPACE_ID,
        providerId: "amazon-seller",
        syncType,
      });
    }

    await connectorValidate(WORKSPACE_ID, "amazon-seller");

    const goLive = assessLiveCommerceGoLive(WORKSPACE_ID);
    assert.ok(goLive.score >= 70);
    assert.equal(goLive.goLiveEligible, true);
    assert.equal(goLive.blockers.length, 0);
  });
});
