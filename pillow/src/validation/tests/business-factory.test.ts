import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleBusinessFactoryArchitecture,
  buildFallbackBusinessFactoryArchitecture,
  FACTORY_PIPELINE,
  FACTORY_PRINCIPLES,
} from "../../business-factory/index.js";

describe("P8-01 Business Factory Architecture", () => {
  test("assembles full factory from commerce and operational snapshots", () => {
    const view = assembleBusinessFactoryArchitecture({
      commerceReport: {
        executiveBrief: "Three launch-ready concepts identified",
        riskAssessment: "Supplier concentration moderate",
        recommendedActions: ["Prioritize highest-margin launch plan", "Validate CRIR gate"],
        launchPlans: [
          {
            productId: "prod-001",
            storeConcept: "Eco Home Essentials",
            brandPositioning: "Sustainable home goods",
            launchReadiness: "ready",
            marketingRecommendations: ["Meta prospecting campaign"],
          },
          {
            productId: "prod-002",
            storeConcept: "Active Gear Co",
            brandPositioning: "Performance accessories",
            launchReadiness: "conditional",
          },
        ],
        marketOpportunities: [{ recommendation: "US home category growth 12%" }],
        recommendedProducts: [{ product: { name: "Bamboo Organizer Set" } }],
      },
      founderShell: {
        grandKingSummary: "Factory manufacturing portfolio businesses",
        executiveHome: { revenue: "$0 · pre-launch", businessStatus: "building" },
      },
      journey: {
        currentJourney: "P8-Business",
        currentRoadmapItem: "P8-01",
        progress: 40,
        timeline: ["10:00 · mission: Factory assembly"],
      },
      ecc: {
        executionState: "coordinating",
        grandKingSummary: "ECC scheduling business creation",
        analysis: { recommendations: ["Coordinate Builder for store deployment"] },
      },
      supervisor: {
        missionHealth: "healthy",
        progress: "55%",
        currentStep: "Factory dashboard",
        currentRisks: [],
      },
      guardian: {
        overallHealth: "healthy",
        runtimeHealth: "healthy",
        analysis: { recommendations: ["All commerce components healthy"], operationalRisks: [] },
      },
    });

    assert.equal(view.architectureVersion, "P8-01");
    assert.equal(view.businesses.length, 2);
    assert.equal(view.businesses[0].stage, "business_launch_ready");
    assert.equal(view.pipeline.length, FACTORY_PIPELINE.length);
    assert.equal(view.principles.length, FACTORY_PRINCIPLES.length);
    assert.ok(view.currentOpportunities.length >= 1);
    assert.ok(view.coordination.length >= 5);
    assert.equal(view.liveBusinessCount, 0);
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackBusinessFactoryArchitecture();
    assert.equal(view.architectureVersion, "P8-01");
    assert.ok(view.businesses.length >= 1);
    assert.match(view.grandKingSummary, /Pillow|Factory/i);
  });
});
