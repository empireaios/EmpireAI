import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  SUPPLIER_PROVIDER_CATALOG,
  SUPPLIER_SCORE_DIMENSIONS,
  buildCjAdapterSkeleton,
  buildSupplierAdapterRegistry,
  buildSupplierDashboard,
  buildExecutiveSupplierBriefing,
  compareSuppliersForProduct,
  detectSupplierRisks,
  evaluateShippingAcceptability,
  findSupplierOpportunities,
  listSupplierProducts,
  prepareFulfillmentHandoff,
  resetSupplierIntelligenceProducts,
  runSupplierWatcher,
  scoreSupplierProduct,
  supplierIntelligenceFoundationTools,
  SUPPLIER_INTELLIGENCE_MISSION_IDS,
} from "../../supplier-intelligence/index.js";
import { resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { resetConnectorRuntimeStates, resetCredentialVaultRepository } from "../../orchestration/reality-integration/index.js";
import { configureValidationEnvironment } from "../harness.js";
import type { SupplierProduct } from "../../supplier-intelligence/models/supplier-product.js";

const WORKSPACE_ID = "ws-sup-001";
const COMPANY_ID = "co-grand-king";

function sampleProduct(overrides: Partial<SupplierProduct> = {}): SupplierProduct {
  return {
    supplierProductId: "sup:test:001",
    providerId: "cj-dropshipping",
    supplierName: "CJdropshipping",
    title: "Test Kitchen Gadget",
    category: "kitchen",
    price: 9,
    costPrice: 9,
    suggestedRetailPrice: 27.99,
    inventory: 200,
    shippingCountries: ["US", "UK"],
    shippingDaysMin: 8,
    shippingDaysMax: 14,
    processingDays: 2,
    supplierRating: 4.1,
    images: [],
    videos: [],
    specs: {},
    variants: [],
    tags: [],
    dataAuthority: "supplier_input",
    ingestedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Supplier Intelligence Foundation (SUP-001–SUP-015)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
    resetCredentialVaultRepository();
    resetConnectorRuntimeStates();
    resetSupplierIntelligenceProducts();
  });

  afterEach(() => {
    resetSupplierIntelligenceProducts();
    resetCredentialVaultRepository();
    resetConnectorRuntimeStates();
    resetGkrRepository();
    resetDatabaseInstance();
  });

  it("SUP-001 — supplier abstraction layer tracks multi-provider catalog", () => {
    assert.ok(SUPPLIER_PROVIDER_CATALOG.length >= 10);
    const adapters = buildSupplierAdapterRegistry(WORKSPACE_ID);
    assert.equal(adapters.length, SUPPLIER_PROVIDER_CATALOG.length);
    assert.ok(adapters.find((a) => a.providerId === "cj-dropshipping"));
    assert.ok(adapters.find((a) => a.providerId === "spocket"));
    assert.ok(adapters.find((a) => a.providerId === "aliexpress"));
  });

  it("SUP-002 — supplier product model tracks required fields", () => {
    const products = listSupplierProducts(WORKSPACE_ID);
    assert.ok(products.length >= 1);
    const p = products[0]!;
    assert.ok(p.supplierProductId);
    assert.ok(p.title);
    assert.equal(p.dataAuthority, "supplier_input");
  });

  it("SUP-003 — CJ adapter skeleton has no fake live API", () => {
    const skeleton = buildCjAdapterSkeleton(false);
    assert.equal(skeleton.missionId, "SUP-003");
    assert.equal(skeleton.architectureOnly, true);
    assert.ok(skeleton.operations.length >= 6);
    assert.ok(skeleton.blockers.some((b) => b.includes("architecture")));
  });

  it("SUP-004 — supplier scoring engine scores all dimensions", () => {
    assert.equal(SUPPLIER_SCORE_DIMENSIONS.length, 10);
    const score = scoreSupplierProduct(sampleProduct());
    assert.ok(score.overallScore >= 0 && score.overallScore <= 100);
    assert.equal(score.breakdown.length, 10);
  });

  it("SUP-005 — shipping acceptability never rejects on time alone", () => {
    const result = evaluateShippingAcceptability({
      targetCountry: "US",
      category: "kitchen",
      shippingDaysMin: 25,
      shippingDaysMax: 30,
      pricePoint: 9,
      suggestedRetailPrice: 29.99,
      marginPercent: 45,
    });
    assert.equal(result.shippingTimeAloneWouldReject, false);
    assert.ok(result.factors.length > 0);
  });

  it("SUP-006 — supplier comparison recommends non-CJ when better", () => {
    const products = listSupplierProducts(WORKSPACE_ID);
    const comparison = compareSuppliersForProduct("Kitchen product", "US", products);
    assert.ok(comparison.entries.length >= 2);
    assert.ok(comparison.recommendedProviderId);
  });

  it("SUP-007 — supplier risk engine detects risks", () => {
    const risks = detectSupplierRisks(sampleProduct({ inventory: 5, shippingDaysMax: 28 }));
    assert.ok(risks.some((r) => r.riskType === "unstable_stock"));
    assert.ok(risks.some((r) => r.riskType === "slow_shipping"));
  });

  it("SUP-008 — supplier opportunity engine finds launch candidates", () => {
    const opps = findSupplierOpportunities(WORKSPACE_ID);
    assert.ok(opps.length >= 1);
    assert.ok(opps[0]!.score.overallScore > 0);
  });

  it("SUP-011 — supplier dashboard exposes HQ metrics", () => {
    const dashboard = buildSupplierDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.missionId, "SUP-011");
    assert.ok(dashboard.architecturePercent >= 80);
    assert.ok(dashboard.productsFound >= 1);
    assert.ok(dashboard.cjReadiness.missionId === "OAR-006");
  });

  it("SUP-012 — executive council receives supplier briefing", () => {
    const dashboard = buildSupplierDashboard(WORKSPACE_ID, COMPANY_ID);
    const briefing = buildExecutiveSupplierBriefing(dashboard);
    assert.equal(briefing.supplyChainChief.executiveId, "csco");
    assert.equal(briefing.merchantChief.executiveId, "cmo-merchant");
    assert.ok(briefing.supplyChainChief.summary.includes("supplier"));
  });

  it("SUP-013 — supplier watcher generates alerts", () => {
    const dashboard = buildSupplierDashboard(WORKSPACE_ID, COMPANY_ID);
    const alerts = runSupplierWatcher(WORKSPACE_ID, dashboard);
    assert.ok(Array.isArray(alerts));
  });

  it("SUP-014 — fulfillment handoff blocks live without credentials", () => {
    const handoff = prepareFulfillmentHandoff(WORKSPACE_ID, COMPANY_ID, sampleProduct());
    assert.equal(handoff.liveExecutionAllowed, false);
    assert.ok(handoff.blockers.length > 0);
    assert.ok(handoff.ofdMilestone);
  });

  it("SUP-015 — registers brain tools and mission IDs", () => {
    assert.equal(SUPPLIER_INTELLIGENCE_MISSION_IDS.length, 15);
    assert.equal(supplierIntelligenceFoundationTools.length, 6);
    assert.ok(supplierIntelligenceFoundationTools.some((t) => t.name === "supplier_intelligence.dashboard"));
  });
});
