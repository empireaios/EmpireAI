import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildGlobalCommerceRegistry,
  buildGlobalCommerceDashboard,
  buildOrLoadGlobalCommerceIdentity,
  computeCountryOnboardingBatch,
  computeOnboardingReadiness,
  createGlobalExpansionPlan,
  getMarketplacesByCountry,
  resetGlobalCommerceRepository,
} from "../../runtime/global-commerce/index.js";
import { resetRuntimePluginRegistry } from "../../runtime/plugins/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-b006";
const COMPANY_ID = "co-grand-king";

describe("Build Wave 2 — Global Commerce Identity + Market Coverage (B-006–B-010)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalCommerceRepository();
    resetRuntimePluginRegistry();
  });

  afterEach(() => {
    resetGlobalCommerceRepository();
    resetRuntimePluginRegistry();
    resetDatabaseInstance();
  });

  it("B-006 — global registry covers 19 countries and required marketplaces", () => {
    const registry = buildGlobalCommerceRegistry();
    assert.equal(registry.totals.countries, 19);
    assert.equal(registry.totals.regions, 3);
    assert.ok(registry.totals.marketplaces >= 70);

    const sg = getMarketplacesByCountry("SG");
    assert.ok(sg.some((p) => p.providerId === "shopee-sg"));
    assert.ok(sg.some((p) => p.providerId === "carousell-sg"));

    const us = getMarketplacesByCountry("US");
    assert.ok(us.some((p) => p.providerId === "amazon-us"));
    assert.ok(us.some((p) => p.providerId === "shopify-us"));
  });

  it("B-007 — global commerce identity tracks readiness without plaintext credentials", () => {
    const identity = buildOrLoadGlobalCommerceIdentity({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.equal(identity.workspaceId, WORKSPACE_ID);
    assert.ok(identity.countryReadiness.length >= 19);
    assert.ok(Array.isArray(identity.humanActionsRequired));
    assert.ok(identity.marketplaceAccounts.every((a) => !("password" in a)));
    assert.ok(identity.marketplaceAccounts.every((a) => !("apiKey" in a)));
  });

  it("B-008 — onboarding readiness returns status, score, and actions", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const readiness = computeOnboardingReadiness(WORKSPACE_ID, COMPANY_ID, "US", "shopify-us");

    assert.ok(readiness.status);
    assert.ok(readiness.readinessScore >= 0);
    assert.ok(Array.isArray(readiness.missingActions));
    assert.ok(Array.isArray(readiness.humanActions));
    assert.ok(Array.isArray(readiness.automatableActions));
    assert.ok(readiness.risk);
    assert.ok(readiness.estimatedSetupDifficulty);

    const batch = computeCountryOnboardingBatch(WORKSPACE_ID, COMPANY_ID, "SG");
    assert.ok(batch.length >= 6);
  });

  it("B-009 — expansion planner prioritizes countries with rationale", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const plan = createGlobalExpansionPlan(WORKSPACE_ID, COMPANY_ID, {
      productCategory: "electronics",
      supplierAvailable: true,
      maxCountries: 5,
    });

    assert.ok(plan.planId);
    assert.equal(plan.priorityCountries.length, 5);
    assert.ok(plan.launchSequence.length > 0);
    assert.ok(plan.priorityCountries[0]!.why.length > 0);
    assert.ok(plan.priorityCountries[0]!.priorityMarketplaces.length > 0);
  });

  it("B-010 — mission control dashboard exposes global footprint", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const dashboard = buildGlobalCommerceDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "global-commerce");
    assert.equal(dashboard.missionId, "B-006-B-010");
    assert.equal(dashboard.globalCommerceFootprint.countries, 19);
    assert.ok(Array.isArray(dashboard.countriesReady));
    assert.ok(Array.isArray(dashboard.countriesBlocked));
    assert.ok(Array.isArray(dashboard.humanActionsRequired));
    assert.ok(Array.isArray(dashboard.runtimePluginCoverage));
    assert.equal(dashboard.runtimeHealth.executionBlocked, true);
  });
});
