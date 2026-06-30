import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  EMPIRE_ACCESS_PLATFORMS,
  ACCESS_STATE_VALUES,
  ACCESS_STATE_TRANSITIONS,
  ACTION_BOUNDARY_RULES,
  PERMISSION_TYPES,
  buildEmpireAccessRegistry,
  buildAccessDashboard,
  buildAmazonAccessReadiness,
  buildCjAccessReadiness,
  buildPermissionMatrix,
  classifyAction,
  inspectOperationalAccessCoverage,
  resetEmpireAccessRegistry,
  operationalAccessTools,
  FUTURE_MARKETPLACE_IDS,
} from "../../operational-access/index.js";
import { connectProvider, resetConnectorRuntimeStates, resetCredentialVaultRepository } from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-oar-001";
const COMPANY_ID = "co-grand-king";

describe("Operational Access Registry (OAR-001–OAR-010)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetCredentialVaultRepository();
    resetConnectorRuntimeStates();
    resetEmpireAccessRegistry();
  });

  afterEach(() => {
    resetEmpireAccessRegistry();
    resetCredentialVaultRepository();
    resetConnectorRuntimeStates();
    resetDatabaseInstance();
  });

  it("OAR-001 — Empire Access Registry tracks all required external platforms", () => {
    const registry = buildEmpireAccessRegistry(WORKSPACE_ID);
    assert.equal(registry.missionId, "OAR-001");
    assert.equal(registry.records.length, EMPIRE_ACCESS_PLATFORMS.length);
    assert.ok(registry.records.length >= 19);
    assert.equal(registry.summary.architectureComplete, true);

    const ids = new Set(registry.records.map((r) => r.platformId));
    for (const required of ["github", "cursor", "vercel", "amazon-seller", "cj-dropshipping", "stripe", "openai"]) {
      assert.ok(ids.has(required), `missing ${required}`);
    }
  });

  it("OAR-002 — access state machine includes BLOCKED and standard transitions", () => {
    assert.ok(ACCESS_STATE_VALUES.includes("BLOCKED"));
    assert.ok(ACCESS_STATE_VALUES.includes("AUTH_REQUIRED"));
    assert.ok(ACCESS_STATE_TRANSITIONS.length >= 8);
  });

  it("OAR-003 — permission matrix covers standard permission types", () => {
    assert.equal(PERMISSION_TYPES.length, 11);
    const matrix = buildPermissionMatrix({
      platformId: "amazon-seller",
      displayName: "Amazon Seller",
      accessState: "NOT_CONNECTED",
      grantedScopes: [],
      architectureOnly: true,
    });
    assert.ok(matrix.permissions.some((p) => p.permission === "publish"));
    assert.ok(matrix.missingCount > 0);
  });

  it("OAR-004 — approval boundary classifies irreversible actions", () => {
    assert.ok(ACTION_BOUNDARY_RULES.length >= 10);
    const publish = classifyAction("publish_listing", "amazon-seller");
    assert.equal(publish?.boundary, "requires_king_approval");
    const deleteRule = classifyAction("delete_listing", "amazon-seller");
    assert.equal(deleteRule?.boundary, "forbidden");
  });

  it("OAR-005 — Amazon SP-API readiness map", () => {
    const readiness = buildAmazonAccessReadiness("NOT_CONNECTED", false, []);
    assert.equal(readiness.missionId, "OAR-005");
    assert.ok(readiness.oauth.supported);
    assert.ok(readiness.regionalMarketplaces.supported);
    assert.ok(readiness.blockers.length > 0);
  });

  it("OAR-006 — CJdropshipping API readiness map", () => {
    const readiness = buildCjAccessReadiness("NOT_CONNECTED", false);
    assert.equal(readiness.missionId, "OAR-006");
    assert.ok(readiness.productSearch.supported);
    assert.ok(readiness.fulfillment.supported);
  });

  it("OAR-007 — future marketplace provider records", () => {
    assert.equal(FUTURE_MARKETPLACE_IDS.length, 6);
    const registry = buildEmpireAccessRegistry(WORKSPACE_ID);
    for (const id of FUTURE_MARKETPLACE_IDS) {
      assert.ok(registry.records.find((r) => r.platformId === id));
    }
  });

  it("OAR-008 — access dashboard exposes connected, blocked, ready, and revenue gaps", async () => {
    await connectProvider({
      workspaceId: WORKSPACE_ID,
      providerId: "stripe",
      credentialType: "api_key",
      secretPayload: { apiKey: "sk_test" },
    });

    const dashboard = buildAccessDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.missionId, "OAR-008");
    assert.equal(dashboard.architectureComplete, true);
    assert.ok(dashboard.summary.totalPlatforms >= 19);
    assert.ok(dashboard.revenueBlockingGaps.length > 0);
    assert.ok(dashboard.amazonReadiness.missionId === "OAR-005");
    assert.ok(dashboard.cjReadiness.missionId === "OAR-006");
    assert.ok(dashboard.marketplaceReadiness.length === 6);
  });

  it("OAR-009 — ESIS operational access coverage inspection", () => {
    const report = inspectOperationalAccessCoverage(WORKSPACE_ID, COMPANY_ID);
    assert.ok(report.summary.includes("Operational Access"));
    assert.equal(report.architectureComplete, true);
    assert.ok(report.totalPlatforms >= 19);
  });

  it("OAR-010 — registers brain tools", () => {
    assert.equal(operationalAccessTools.length, 4);
    assert.ok(operationalAccessTools.some((t) => t.name === "operational_access.dashboard"));
  });
});
