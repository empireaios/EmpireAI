import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCommerceOperatingModel } from "../../commerce-operating-model/assembler.js";
import { assembleBusinessFactoryArchitecture } from "../../business-factory/assembler.js";
import {
  assembleBusinessAutomationArchitecture,
  buildFallbackBusinessAutomationArchitecture,
  BUSINESS_AUTOMATION_PIPELINE,
  BUSINESS_AUTOMATION_LEVELS,
} from "../../business-automation/index.js";

describe("P8-04 Business Automation Architecture", () => {
  test("assembles business automation from commerce and zero-human snapshots", () => {
    const factory = assembleBusinessFactoryArchitecture({
      commerceReport: {
        launchPlans: [
          {
            productId: "prod-001",
            storeConcept: "Eco Home",
            brandPositioning: "Sustainable",
            launchReadiness: "ready",
          },
        ],
      },
    });

    const commerce = assembleCommerceOperatingModel({ factory });

    const view = assembleBusinessAutomationArchitecture({
      commerce,
      zeroHuman: {
        automationLevel: "Supervised Autonomous",
        automationHealth: "healthy",
        activeAutomation: "Product publishing workflow",
        automationSuccessRate: "94%",
        recoveryStatus: "None",
        pipelineProgress: "65%",
        grandKingSummary: "Business automation active",
        analysis: { recommendations: ["Upgrade order routing to supervised automation"] },
      },
      recovery: { currentIncident: "None" },
    });

    assert.equal(view.architectureVersion, "P8-04");
    assert.equal(view.pipeline.length, BUSINESS_AUTOMATION_PIPELINE.length);
    assert.equal(view.automationLevels.length, BUSINESS_AUTOMATION_LEVELS.length);
    assert.ok(view.automationRules.length >= 2);
    assert.ok(view.activeAutomations.length >= 1);
    assert.equal(view.integrations.commerceHealth, commerce.commerceHealth);
    assert.match(view.automationLevel, /Supervised/i);
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackBusinessAutomationArchitecture();
    assert.equal(view.architectureVersion, "P8-04");
    assert.match(view.grandKingSummary, /Pillow|automation/i);
  });
});
