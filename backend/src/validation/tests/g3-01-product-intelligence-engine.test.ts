import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_01_CAPABILITIES,
  G3_01_V1_SOURCES,
  buildProductIntelligenceEngineArchitecture,
  loadProductIntelligenceEngineView,
  mapCatalogToAnalysisContract,
  rankAnalysisContracts,
} from "../../intelligence/product-intelligence-engine/engine-architecture.js";
import { loadProductIntelligenceEngineViewForWorkspace } from "../../domain/services/product-intelligence-engine-views.js";
import { loadIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-01 — Product Intelligence Engine (architecture)", () => {
  it("discovers V1 deployment channels from marketplace registry (not hardcoded in engine)", () => {
    const arch = buildProductIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-01-v1");
    assert.equal(arch.missionRef, "G3-01");
    assert.ok(arch.scopeGate.includes("no live API"));
    assert.ok(arch.marketDiscovery.countries.length > 0);
    assert.ok(arch.marketDiscovery.expansionMarketplaces.length > 0);

    const ids = arch.sources.map((s) => s.id);
    assert.ok(ids.includes("cj-dropshipping"));
    assert.ok(ids.includes("amazon-us"));
    assert.ok(ids.includes("amazon-sg"));
    assert.ok(ids.includes("shopee-sg"));
    assert.ok(ids.includes("shopify"));
    assert.equal(G3_01_CAPABILITIES.length, 10);
    assert.deepEqual(
      arch.sources.map((s) => s.id),
      G3_01_V1_SOURCES.map((s) => s.id),
    );
  });

  it("integrates with five executive AI engines", () => {
    const arch = buildProductIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("supplier-engine"));
    assert.ok(engineIds.includes("marketplace-engine"));
    assert.ok(engineIds.includes("quantitative-intelligence-engine"));
    assert.ok(engineIds.includes("advertising-engine"));
    assert.ok(engineIds.includes("analytics-engine"));
    assert.ok(arch.dataFlow.length >= 5);
  });

  it("maps catalog records to seven-field analysis contract", () => {
    const view = loadProductIntelligenceEngineViewForWorkspace("ws_g301");
    assert.ok(view.catalogSize >= 0);
    if (view.analysedProducts.length > 0) {
      const product = view.analysedProducts[0]!;
      assert.ok(typeof product.intelligenceScore === "number");
      assert.ok(typeof product.profitScore === "number");
      assert.ok(typeof product.competitionScore === "number");
      assert.ok(typeof product.riskScore === "number");
      assert.ok(typeof product.confidence === "number");
      assert.ok(Array.isArray(product.supportingEvidence));
      assert.ok(product.recommendedAction);
    }
  });

  it("ranks products by composite intelligence score", () => {
    const view = loadProductIntelligenceEngineViewForWorkspace("ws_g301");
    const ranked = rankAnalysisContracts(view.analysedProducts);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.intelligenceScore * 0.5 + a.profitScore * 0.3 - a.riskScore * 0.2;
      const scoreB = b.intelligenceScore * 0.5 + b.profitScore * 0.3 - b.riskScore * 0.2;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("wires cockpit intelligence panel to G3-01 artifact ref", () => {
    const panel = loadIntelligenceEnginePanel("ws_g301");
    assert.equal(panel.displayName, "Product Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-01-product-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 5);
  });

  it("builds empty catalog view without fabricated products", () => {
    const empty = loadProductIntelligenceEngineView([]);
    assert.equal(empty.catalogSize, 0);
    assert.equal(empty.analysedProducts.length, 0);
    assert.ok(empty.nextExecutiveAction.includes("Seed"));
  });
});
