import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildAmazonCapabilityProfile,
  createAmazonListingPackage,
  evaluateAmazonListingReadiness,
  buildAmazonMissionControlDashboard,
  createAmazonRuntimePlugin,
  resetAmazonListingRepository,
} from "../../runtime/amazon-global-seller/index.js";
import { getRuntimePluginRegistry, resetRuntimePluginRegistry } from "../../runtime/plugins/index.js";
import { resetConnectorRuntimeStates, resetCredentialVaultRepository, resetConnectorMonitoringRepository } from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-rs001";
const COMPANY_ID = "co-grand-king";

const SAMPLE_LISTING = {
  sku: "AMZ-ELEC-001",
  marketplaceRegion: "US",
  title: "Wireless Bluetooth Earbuds with Noise Cancellation",
  bullets: [
    "Premium sound quality with active noise cancellation technology",
    "30-hour battery life with charging case included",
    "IPX5 water resistance for workouts and outdoor use",
  ],
  description: "Experience premium audio with our wireless Bluetooth earbuds featuring advanced noise cancellation, long battery life, and comfortable fit for all-day wear.",
  searchTerms: ["earbuds", "bluetooth", "wireless", "noise cancelling"],
  category: "Electronics > Headphones",
  brand: "EmpireAudio",
  attributes: [{ name: "Color", value: "Black" }],
  pricing: { currency: "USD", listPrice: 49.99, salePrice: 39.99, costOfGoods: 12.0 },
  inventory: { quantity: 100, fulfillmentChannel: "FBM" as const, leadTimeDays: 2 },
  shipping: { weightKg: 0.15, lengthCm: 10, widthCm: 8, heightCm: 4 },
  images: [{ url: "https://example.com/main.jpg", variant: "MAIN" as const }],
  compliance: { productSafety: false, restrictedProduct: false, hazmat: false, brandRegistryRequired: false, categoryApprovalRequired: false, documentsProvided: [] },
};

describe("Revenue Slice 001 — Amazon Global Seller (RS-001–RS-005)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetAmazonListingRepository();
    resetRuntimePluginRegistry();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
  });

  afterEach(() => {
    resetAmazonListingRepository();
    resetRuntimePluginRegistry();
    resetCredentialVaultRepository();
    resetConnectorMonitoringRepository();
    resetConnectorRuntimeStates();
    resetDatabaseInstance();
  });

  it("RS-001 — Amazon capability profile covers all seller domains", () => {
    const profile = buildAmazonCapabilityProfile();
    assert.equal(profile.providerId, "amazon-seller");
    assert.equal(profile.domains.length, 14);
    assert.ok(profile.domains.some((d) => d.domain === "listings"));
    assert.ok(profile.domains.some((d) => d.domain === "fulfillment"));
    assert.ok(profile.domains.some((d) => d.domain === "compliance"));
    assert.ok(profile.regionalMarketplaces.length >= 10);
    assert.ok(profile.domains.every((d) => d.documentationUrl.startsWith("https://")));
  });

  it("RS-002 — Amazon runtime plugin maps capabilities and integrates with registry", () => {
    const plugin = createAmazonRuntimePlugin();
    assert.equal(plugin.manifest.pluginId, "amazon-seller");
    assert.equal(plugin.manifest.executionState, "ARCHITECTURE_ONLY");
    assert.ok(plugin.supportsMarketplaceCapability("publish_product"));
    assert.ok(plugin.supportsMarketplaceCapability("orders"));
    assert.equal(plugin.supportsMarketplaceCapability("collections"), false);

    const coverage = plugin.getAmazonDomainCoverage();
    assert.equal(coverage.length, 14);
    assert.ok(coverage.some((c) => c.domain === "listings" && c.mappedCapability === "publish_product"));

    const registry = getRuntimePluginRegistry();
    assert.ok(registry.getPlugin("amazon-seller"));
  });

  it("RS-003 — canonical listing package validates required fields", () => {
    const listing = createAmazonListingPackage(WORKSPACE_ID, COMPANY_ID, SAMPLE_LISTING);
    assert.ok(listing.listingId);
    assert.equal(listing.sku, "AMZ-ELEC-001");
    assert.equal(listing.marketplaceRegion, "US");
    assert.ok(listing.bullets.length >= 3);
    assert.ok(listing.images.some((i) => i.variant === "MAIN"));
  });

  it("RS-004 — readiness evaluation returns ready, missing info, and compliance risks", () => {
    const listing = createAmazonListingPackage(WORKSPACE_ID, COMPANY_ID, SAMPLE_LISTING);
    const evaluation = evaluateAmazonListingReadiness(WORKSPACE_ID, COMPANY_ID, listing);
    assert.equal(evaluation.ready, true);
    assert.ok(evaluation.publishReadinessPercent >= 80);
    assert.equal(evaluation.missingInformation.length, 0);

    const blocked = createAmazonListingPackage(WORKSPACE_ID, COMPANY_ID, {
      ...SAMPLE_LISTING,
      sku: "AMZ-BLOCKED-001",
      compliance: { productSafety: true, restrictedProduct: true, hazmat: false, brandRegistryRequired: true, categoryApprovalRequired: true, documentsProvided: [] },
    });
    const blockedEval = evaluateAmazonListingReadiness(WORKSPACE_ID, COMPANY_ID, blocked);
    assert.equal(blockedEval.ready, false);
    assert.ok(blockedEval.complianceRisks.length > 0);
    assert.ok(blockedEval.requiredHumanActions.length > 0);
  });

  it("RS-005 — Mission Control dashboard exposes Amazon panel payload", () => {
    createAmazonListingPackage(WORKSPACE_ID, COMPANY_ID, SAMPLE_LISTING);
    const dashboard = buildAmazonMissionControlDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "amazon-global-seller");
    assert.equal(dashboard.missionId, "RS-001-RS-005");
    assert.equal(dashboard.amazonRuntimeStatus.pluginId, "amazon-seller");
    assert.ok(dashboard.listingReadiness.readyCount >= 1);
    assert.ok(dashboard.commercialReadinessPercent >= 0);
    assert.ok(dashboard.nextHumanAction);
  });
});
