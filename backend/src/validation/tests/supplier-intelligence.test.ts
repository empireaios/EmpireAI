import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInMemorySupplierRepository,
  createSupplierIntelligenceModule,
  evaluateRequiredCapabilities,
  scoreSupplierProfile,
} from "../../intelligence/supplier-intelligence/index.js";

const WORKSPACE_ID = "ws-m028";

function buildTrustedSupplierInput() {
  return {
    supplierId: "supplier-trusted-001",
    supplierName: "Evergreen Fulfillment Co.",
    country: "United States",
    categories: ["kitchen", "home"],
    fulfillmentScore: 88,
    reliabilityScore: 90,
    communicationScore: 85,
    qualityScore: 87,
    capability: {
      supportsDropshipping: true,
      supportsBranding: true,
      supportsCustomPackaging: true,
      supportsBulkOrders: true,
    },
  };
}

function buildRiskySupplierInput() {
  return {
    supplierId: "supplier-risky-002",
    supplierName: "Unverified Trade Hub",
    country: "CN",
    categories: ["electronics"],
    fulfillmentScore: 42,
    reliabilityScore: 38,
    communicationScore: 35,
    qualityScore: 40,
    capability: {
      supportsDropshipping: true,
      supportsBranding: false,
      supportsCustomPackaging: false,
      supportsBulkOrders: false,
    },
  };
}

describe("Mission 028 Supplier Intelligence Foundation", () => {
  it("creates supplier profiles with computed trust and risk fields", async () => {
    const repository = createInMemorySupplierRepository();
    const module = createSupplierIntelligenceModule(repository);
    const created = await module.createSupplier(WORKSPACE_ID, buildTrustedSupplierInput());

    assert.equal(created.supplierId, "supplier-trusted-001");
    assert.equal(created.supplierName, "Evergreen Fulfillment Co.");
    assert.ok(created.trustScore >= 80);
    assert.equal(created.riskProfile.riskLevel, "low");
    assert.deepEqual(created.categories, ["kitchen", "home"]);
  });

  it("scores supplier trust from fulfillment, reliability, communication, and quality", () => {
    const trusted = scoreSupplierProfile(buildTrustedSupplierInput());
    const risky = scoreSupplierProfile(buildRiskySupplierInput());

    assert.ok(trusted.trustScore > risky.trustScore);
    assert.equal(trusted.sourceable, true);
    assert.equal(risky.sourceable, false);
    assert.ok(trusted.reasoning.includes("reliably sourceable"));
  });

  it("calculates risk profile dimensions and overall risk level", () => {
    const risky = scoreSupplierProfile(buildRiskySupplierInput());

    assert.ok(risky.riskProfile.disputeRisk >= 55);
    assert.ok(risky.riskProfile.shippingRisk >= 50);
    assert.ok(risky.riskProfile.qualityRisk >= 50);
    assert.ok(risky.riskProfile.fraudRisk >= 30);
    assert.ok(["high", "critical"].includes(risky.riskProfile.riskLevel));
  });

  it("evaluates supplier capabilities against sourcing requirements", () => {
    const capability = buildTrustedSupplierInput().capability;
    const fullFit = evaluateRequiredCapabilities(capability, {
      supportsDropshipping: true,
      supportsBranding: true,
    });
    const partialFit = evaluateRequiredCapabilities(buildRiskySupplierInput().capability, {
      supportsDropshipping: true,
      supportsBranding: true,
      supportsBulkOrders: true,
    });

    assert.equal(fullFit.met, true);
    assert.equal(fullFit.score, 100);
    assert.equal(partialFit.met, false);
    assert.ok(partialFit.missing.includes("branding"));
    assert.ok(partialFit.missing.includes("bulk orders"));
  });

  it("persists supplier profiles in repository via module", async () => {
    const repository = createInMemorySupplierRepository();
    const module = createSupplierIntelligenceModule(repository);
    const input = buildTrustedSupplierInput();

    const created = await module.createSupplier(WORKSPACE_ID, input);
    const stored = await repository.getBySupplierId(WORKSPACE_ID, input.supplierId);
    const listed = await module.listSuppliers(WORKSPACE_ID, { minTrustScore: 70 });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.supplierId, input.supplierId);
    assert.equal(listed.length, 1);
    assert.equal(module.canReliablySource(stored!), true);
  });
});
