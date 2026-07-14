import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleBusinessFactoryArchitecture } from "../../business-factory/assembler.js";
import {
  assembleCommerceOperatingModel,
  buildFallbackCommerceOperatingModel,
  COMMERCE_PIPELINE,
  COMMERCE_PRINCIPLES,
  COMMERCE_BUSINESS_LIFECYCLE,
} from "../../commerce-operating-model/index.js";

describe("P8-02 Commerce Operating Model", () => {
  test("assembles commerce model from factory and commerce intelligence", () => {
    const factory = assembleBusinessFactoryArchitecture({
      commerceReport: {
        executiveBrief: "Commerce pipeline active",
        riskAssessment: "Supplier risk moderate",
        recommendedActions: ["Launch highest-margin store"],
        launchPlans: [
          {
            productId: "prod-001",
            storeConcept: "Eco Home Essentials",
            brandPositioning: "Sustainable home goods",
            launchReadiness: "ready",
            preferredSupplierId: "sup-001",
            catalogueItems: ["Bamboo Organizer"],
            marketingRecommendations: ["Meta prospecting"],
          },
        ],
        recommendedProducts: [
          {
            product: { id: "prod-001", name: "Bamboo Organizer", category: "Home" },
            evaluation: { profitMarginPercent: 42 },
          },
        ],
        supplierRankings: [{ supplier: { id: "sup-001", name: "CJ Premium" } }],
      },
      founderShell: {
        executiveHome: { revenue: "$0 pre-launch" },
      },
      guardian: { overallHealth: "healthy" },
    });

    const view = assembleCommerceOperatingModel({
      factory,
      commerceReport: {
        launchPlans: [
          {
            productId: "prod-001",
            storeConcept: "Eco Home Essentials",
            brandPositioning: "Sustainable home goods",
            launchReadiness: "ready",
            preferredSupplierId: "sup-001",
            catalogueItems: ["Bamboo Organizer"],
            marketingRecommendations: ["Meta prospecting"],
          },
        ],
        recommendedProducts: [
          {
            product: { id: "prod-001", name: "Bamboo Organizer", category: "Home" },
            evaluation: { profitMarginPercent: 42 },
          },
        ],
        supplierRankings: [{ supplier: { id: "sup-001", name: "CJ Premium" } }],
      },
    });

    assert.equal(view.architectureVersion, "P8-02");
    assert.equal(view.pipeline.length, COMMERCE_PIPELINE.length);
    assert.equal(view.principles.length, COMMERCE_PRINCIPLES.length);
    assert.equal(view.lifecycle.length, COMMERCE_BUSINESS_LIFECYCLE.length);
    assert.ok(view.brands.length >= 1);
    assert.ok(view.stores.length >= 1);
    assert.ok(view.products.length >= 1);
    assert.ok(view.revenueModel.streams.length >= 4);
    assert.equal(view.factoryIntegration.factoryBusinessCount, factory.activeBusinessCount);
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackCommerceOperatingModel();
    assert.equal(view.architectureVersion, "P8-02");
    assert.ok(view.businesses.length >= 1);
    assert.match(view.grandKingSummary, /Commerce|Pillow/i);
  });
});
