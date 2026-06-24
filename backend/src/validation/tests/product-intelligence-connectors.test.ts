import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configureValidationEnvironment } from "../harness.js";
import { bootstrapFoundation } from "../../foundation/index.js";
import { getDatabase } from "../../brain/database.js";
import {
  ProductIntelligenceConnectorRegistry,
  PRODUCT_INTELLIGENCE_PROVIDER_IDS,
  aggregateSignalsToInput,
  fetchAndAggregateProductSignals,
} from "../../intelligence/connectors/index.js";
import {
  productIntelligenceService,
  ProductIntelligenceService,
} from "../../intelligence/product-intelligence-engine/service.js";
import { PIE_MOCK_EVALUATIONS } from "../../intelligence/product-intelligence-engine/mock-samples.js";

configureValidationEnvironment();

describe("Mission 012 Product Intelligence Connectors", () => {
  it("registers all required mock providers", () => {
    const registry = new ProductIntelligenceConnectorRegistry();
    const ids = registry.listProviderIds().sort();
    assert.deepEqual(ids, [...PRODUCT_INTELLIGENCE_PROVIDER_IDS].sort());
    assert.equal(ids.length, 8);
  });

  it("allows swapping a provider without changing registry defaults", () => {
    const registry = new ProductIntelligenceConnectorRegistry([
      {
        providerId: "amazon",
        providerName: "Amazon Custom",
        async fetchProductSignals() {
          return {
            providerId: "amazon",
            providerName: "Amazon Custom",
            productTitle: "Probe",
            category: "Test",
            demandIndex: 99,
            competitionIndex: 10,
            marginEstimatePct: 50,
            supplierAvailable: true,
            trendDirection: "rising",
            confidence: 90,
            mock: false,
            fetchedAt: new Date().toISOString(),
          };
        },
      },
    ]);

    const amazon = registry.get("amazon");
    assert.equal(amazon?.providerName, "Amazon Custom");
    assert.equal(registry.listProviderIds().length, 8);
  });

  it("aggregates connector signals into PIE input", async () => {
    const registry = new ProductIntelligenceConnectorRegistry();
    const aggregated = await fetchAndAggregateProductSignals(
      registry,
      { workspaceId: "ws_pie_conn", correlationId: "corr-1" },
      { productTitle: "Portable USB Blender", category: "Kitchen & Dining" },
      "prod-1",
    );

    assert.equal(aggregated.providerCount, 8);
    assert.ok(aggregated.signals.every((s) => s.mock === true));
    assert.equal(aggregated.input.productTitle, "Portable USB Blender");
    assert.ok(aggregated.input.competitionScore >= 0);
    assert.ok(aggregated.input.historicalDemand.searchVolumeIndex >= 0);

    const manual = aggregateSignalsToInput(aggregated.signals, "ws_pie_conn", "prod-1");
    assert.equal(manual.category, aggregated.input.category);
  });

  it("seeds product intelligence catalog idempotently", () => {
    bootstrapFoundation("ws_pie_m012_seed");
    bootstrapFoundation("ws_pie_m012_seed");

    const count = productIntelligenceService.listProducts("ws_pie_m012_seed").length;
    assert.equal(count, PIE_MOCK_EVALUATIONS.length);

    const signalCount = (
      getDatabase()
        .prepare(
          `SELECT COUNT(*) AS c FROM product_intelligence_signals WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId: "ws_pie_m012_seed" }) as { c: number }
    ).c;
    assert.equal(signalCount, PIE_MOCK_EVALUATIONS.length * PRODUCT_INTELLIGENCE_PROVIDER_IDS.length);
  });

  it("evaluateFromConnectors persists catalog, signals, and evaluation", async () => {
    const service = new ProductIntelligenceService();
    const result = await service.evaluateFromConnectors("ws_pie_m012_eval", {
      productTitle: "Smart Water Bottle",
      category: "Health",
      productId: "pie-custom-001",
      persist: true,
    });

    assert.equal(result.productName, "Smart Water Bottle");
    assert.ok(result.signals.length === 8);
    assert.ok(["SELL", "DO_NOT_SELL", "REVIEW"].includes(result.recommendation));

    const stored = service.getProduct("ws_pie_m012_eval", "pie-custom-001");
    assert.ok(stored);
    assert.equal(stored.signals.length, 8);
  });

  it("product intelligence API service lists and retrieves products", async () => {
    await productIntelligenceService.evaluateFromConnectors("ws_pie_m012_api", {
      productTitle: "API Probe Product",
      category: "Gadgets",
      productId: "pie-api-probe",
      persist: true,
    });

    const list = productIntelligenceService.listProducts("ws_pie_m012_api");
    assert.ok(list.some((p) => p.id === "pie-api-probe"));

    const detail = productIntelligenceService.getProduct("ws_pie_m012_api", "pie-api-probe");
    assert.ok(detail);
    assert.equal(detail.evaluation.productTitle, "API Probe Product");
  });
});
