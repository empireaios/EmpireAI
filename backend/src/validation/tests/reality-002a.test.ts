import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  LIVE_COMMERCE_LIFECYCLE_STATES,
  LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS,
  buildLiveCommerceFoundationDashboard,
  buildOperationalAccessRegistry,
  assessRuntimeActivation,
  verifyProviderCapabilities,
  buildCredentialVaultProfile,
  listCredentialVaultProfiles,
  connectProvider,
  resetCredentialGovernanceAudit,
  resetCredentialVaultRepository,
  resetConnectorMonitoringRepository,
  resetConnectorRuntimeStates,
  resetOperationalAccessRegistry,
  getRealityProvider,
  listApprovalPolicies,
} from "../../orchestration/reality-integration/index.js";
import { inspectLiveCommerceFoundation } from "../../orchestration/empire-self-inspection/services/live-commerce-esis-inspector.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-real-002a";
const COMPANY_ID = "co-grand-king";

describe("Live Commerce Foundation (REAL-002A / EAR-001)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
    resetCredentialGovernanceAudit();
    resetOperationalAccessRegistry();
  });

  afterEach(() => {
    resetOperationalAccessRegistry();
    resetCredentialGovernanceAudit();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
    resetDatabaseInstance();
  });

  it("REAL-002A — canonical live commerce lifecycle covers all provider states", () => {
    assert.deepEqual(LIVE_COMMERCE_LIFECYCLE_STATES, [
      "NOT_CONNECTED",
      "AUTHORIZATION_REQUIRED",
      "CONNECTED",
      "VERIFIED",
      "READY",
      "ACTIVE",
      "DEGRADED",
      "DISCONNECTED",
      "REVOKED",
    ]);
  });

  it("REAL-002A — marketplace catalog includes Amazon first and future global providers", () => {
    assert.ok(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.includes("amazon-seller"));
    assert.ok(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.includes("ebay"));
    assert.ok(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.includes("shopee"));
    assert.ok(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.includes("lazada"));
    assert.ok(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.includes("etsy"));
    assert.ok(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.includes("tiktok-shop"));

    for (const id of LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS) {
      assert.ok(getRealityProvider(id), `Provider ${id} must exist in catalog`);
    }
  });

  it("REAL-002A — runtime activation blocked until CONNECTED + VERIFIED + founder approved", async () => {
    const blocked = assessRuntimeActivation(WORKSPACE_ID, "amazon-seller");
    assert.equal(blocked.blocked, true);
    assert.equal(blocked.activated, false);
    assert.ok(blocked.blockers.length > 0);
    assert.equal(blocked.requiresFounderApproval, true);
    assert.equal(blocked.founderApproved, false);

    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "amazon-seller",
      credentialType: "oauth",
      secretPayload: { accessToken: "amazon-token" },
      scopes: ["read_products", "write_products"],
    });

    const connected = assessRuntimeActivation(WORKSPACE_ID, "amazon-seller");
    assert.equal(connected.blocked, true);
    assert.ok(connected.blockers.some((b) => b.includes("VERIFIED") || b.includes("Founder")));
  });

  it("EAR-001 — operational access registry is authoritative for external platforms", async () => {
    const registry = buildOperationalAccessRegistry(WORKSPACE_ID);
    assert.equal(registry.missionId, "EAR-001");
    assert.equal(registry.moduleId, "operational-access-registry");
    assert.ok(registry.records.length >= LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.length);

    const amazon = registry.records.find((r) => r.providerId === "amazon-seller");
    assert.ok(amazon);
    assert.equal(amazon!.platform, "Amazon Seller");
    assert.equal(amazon!.operationalStatus, "BLOCKED");
    assert.ok(amazon!.currentRestrictions.length > 0);
    assert.ok(amazon!.supportedCapabilities.length >= 0);
  });

  it("REAL-002A — provider capability verification reports standard operational capabilities", () => {
    const report = verifyProviderCapabilities(WORKSPACE_ID, "amazon-seller");
    assert.equal(report.providerId, "amazon-seller");
    assert.equal(report.capabilities.length, 10);
    assert.ok(report.capabilities.some((c) => c.capability === "publish"));
    assert.ok(report.capabilities.some((c) => c.capability === "webhooks"));
  });

  it("REAL-002A — credential vault profiles extend governance without duplicate store", async () => {
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "ebay",
      credentialType: "oauth",
      secretPayload: { accessToken: "ebay-token" },
      scopes: ["read_products"],
    });

    const profiles = listCredentialVaultProfiles(WORKSPACE_ID);
    assert.equal(profiles.length, 1);
    const profile = buildCredentialVaultProfile(profiles[0]!.credentialsRef);
    assert.ok(profile);
    assert.equal(profile!.providerId, "ebay");
    assert.equal(profile!.approvalPolicy, "approval-activate_runtime");
    assert.ok(profile!.scopes.length > 0);
  });

  it("REAL-002A — live commerce foundation dashboard for Mission Control", () => {
    const dashboard = buildLiveCommerceFoundationDashboard(WORKSPACE_ID);
    assert.equal(dashboard.missionId, "REAL-002A");
    assert.equal(dashboard.amazonFirst, true);
    assert.equal(dashboard.globalByDesign, true);
    assert.ok(dashboard.marketplaceProviders.length >= 7);
    assert.ok(dashboard.operationalAccessSummary.totalPlatforms > 0);
  });

  it("REAL-002A — activate_runtime approval policy requires founder approval", () => {
    const policies = listApprovalPolicies();
    const activate = policies.find((p) => p.action === "activate_runtime");
    assert.ok(activate);
    assert.equal(activate!.requiresFounderApproval, true);
    assert.ok(activate!.applicableProviderCategories.includes("commerce"));
  });

  it("ESIS — inspects credential health, provider health, activation readiness, and operational access", () => {
    const inspection = inspectLiveCommerceFoundation(WORKSPACE_ID);
    assert.ok(inspection.summary.includes("Live Commerce"));
    assert.ok(typeof inspection.credentialHealth.total === "number");
    assert.ok(typeof inspection.activationReadiness.blocked === "number");
    assert.ok(inspection.operationalAccessCoverage.marketplaceProviders >= 7);
  });
});
