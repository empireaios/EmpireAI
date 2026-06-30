import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { configureValidationEnvironment } from "../harness.js";
import {
  assessVersion1OperationalActivation,
  isAmazonLiveCommerceActivated,
  isCjLiveCommerceActivated,
  isPillowProductionModeEnabled,
  isPlatformOperationallyLive,
} from "../../orchestration/version-1-activation/version-1-activation-config.js";
import { runVersion1ProductionReadinessReview } from "../../orchestration/version-1-activation/production-readiness-review.js";
import { buildVersion1GoLivePreparation } from "../../orchestration/version-1-activation/go-live-preparation.js";
import { resolveMarketplaceAdapter } from "../../runtime/marketplace-publishing/models/marketplace-adapter.js";
import { buildMarketplaceListingPackage } from "../../runtime/marketplace-publishing/services/marketplace-publishing-service.js";

const PRODUCTION_ENV: NodeJS.ProcessEnv = {
  LIVE_COMMERCE_INTEGRATION_MODE: "production",
  CREDENTIAL_VAULT_KEY: "test-vault-key-32-chars-minimum-xx",
  AMAZON_SP_API_CLIENT_ID: "amz-client-id",
  AMAZON_SP_API_CLIENT_SECRET: "amz-client-secret",
  AMAZON_SP_API_REFRESH_TOKEN: "amz-refresh-token",
  CJ_DROPSHIPPING_API_KEY: "cj-key",
  CJ_DROPSHIPPING_API_SECRET: "cj-secret",
  EMPIRE_V1_OPERATIONAL_READY: "true",
};

function applyEnv(env: NodeJS.ProcessEnv): void {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearActivationEnv(): void {
  for (const key of [
    "LIVE_COMMERCE_INTEGRATION_MODE",
    "CREDENTIAL_VAULT_KEY",
    "AMAZON_SP_API_CLIENT_ID",
    "AMAZON_SP_API_CLIENT_SECRET",
    "AMAZON_SP_API_REFRESH_TOKEN",
    "CJ_DROPSHIPPING_API_KEY",
    "CJ_DROPSHIPPING_API_SECRET",
    "CJ_API_KEY",
    "CJ_API_SECRET",
    "EMPIRE_V1_OPERATIONAL_READY",
  ]) {
    delete process.env[key];
  }
}

describe("Version 1 Operational Activation (M1–M5)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    clearActivationEnv();
  });

  afterEach(() => {
    clearActivationEnv();
  });

  it("M1 — production readiness review fails without production credentials", () => {
    const review = runVersion1ProductionReadinessReview();
    assert.equal(review.productionReadinessPassed, false);
    assert.ok(review.findingsPreventingOperation.length > 0);
  });

  it("M1/M2 — production readiness passes with full production env", () => {
    const review = runVersion1ProductionReadinessReview(PRODUCTION_ENV);
    assert.equal(review.productionReadinessPassed, true);
    assert.equal(review.findingsPreventingOperation.length, 0);
  });

  it("M3 — Amazon adapter supports publish when live-activated", () => {
    const adapter = resolveMarketplaceAdapter("amazon", PRODUCTION_ENV);
    assert.equal(adapter.supportsPublish, true);
    assert.equal(adapter.adapterStatus, "CONNECTED");
    assert.equal(isAmazonLiveCommerceActivated(PRODUCTION_ENV), true);
    assert.equal(isPlatformOperationallyLive("amazon-seller", PRODUCTION_ENV), true);
    assert.equal(isPlatformOperationallyLive("cj-dropshipping", PRODUCTION_ENV), true);
  });

  it("M3 — non-production marketplace remains architecture-only", () => {
    const adapter = resolveMarketplaceAdapter("shopify", PRODUCTION_ENV);
    assert.equal(adapter.supportsPublish, false);
  });

  it("M3 — Amazon publish unblocked with approvals when live-activated", () => {
    applyEnv(PRODUCTION_ENV);
    const pkg = buildMarketplaceListingPackage({
      workspaceId: "ws_empire_1",
      companyId: "co-grand-king",
      productId: "prod-live-001",
      marketplaceId: "amazon",
      title: "Live Product",
      description: "Production listing",
      bulletPoints: ["Feature A"],
      specifications: {},
      price: 29.99,
      images: ["https://example.com/img.jpg"],
      executiveCouncilApproved: true,
      kingApproved: true,
    });
    assert.ok(!pkg.blockers.some((b) => b.includes("architecture-only")));
  });

  it("M4 — go-live preparation does not execute go-live", () => {
    const prep = buildVersion1GoLivePreparation("ws_empire_1", "co-grand-king", PRODUCTION_ENV);
    assert.equal(prep.goLiveExecuted, false);
    assert.equal(prep.deploymentVerification.healthEndpoint, "/health");
    assert.equal(prep.pillowProductionMode.approvalGatesPreserved, true);
  });

  it("M5 — Pillow production mode requires EMPIRE_V1_OPERATIONAL_READY", () => {
    const withoutFlag = { ...PRODUCTION_ENV, EMPIRE_V1_OPERATIONAL_READY: "false" };
    assert.equal(isPillowProductionModeEnabled(withoutFlag), false);
    assert.equal(isPillowProductionModeEnabled(PRODUCTION_ENV), true);
  });

  it("M2 — CJ live activation detected with alternate env names", () => {
    const altEnv: NodeJS.ProcessEnv = {
      ...PRODUCTION_ENV,
      CJ_DROPSHIPPING_API_KEY: undefined,
      CJ_DROPSHIPPING_API_SECRET: undefined,
      CJ_API_KEY: "cj-alt-key",
      CJ_API_SECRET: "cj-alt-secret",
    };
    assert.equal(isCjLiveCommerceActivated(altEnv), true);
    const assessment = assessVersion1OperationalActivation(altEnv);
    assert.equal(assessment.ready, true);
  });
});
