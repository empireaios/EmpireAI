import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleExplainabilityArchitecture,
  buildFallbackExplainabilityArchitecture,
} from "../../explainability/index.js";

describe("P7-07 Explainability Architecture", () => {
  test("assembles full explainability from operational snapshots", () => {
    const view = assembleExplainabilityArchitecture({
      supervisor: {
        missionHealth: "attention_required",
        currentMission: "P7-07 Explainability",
        currentStep: "Dashboard assembly",
        progress: "55%",
        grandKingSummary: "Supervisor monitoring P7-07 execution",
        validationStatus: "in_progress",
        recoveryStatus: "None",
        analysis: { recommendations: ["Continue mission execution"] },
      },
      ecc: {
        currentMission: "P7-07",
        priority: "high",
        executionState: "coordinating",
        grandKingSummary: "ECC coordinating Builder handoff",
        analysis: { recommendations: ["Pillow governs priority — ECC coordinates handoff"] },
      },
      vie: {
        visionAlignment: "aligned",
        grandKingSummary: "Vision integrity maintained",
        currentRecommendations: ["Maintain constitutional explainability"],
        currentViolations: [],
      },
      guardian: {
        overallHealth: "healthy",
        runtimeHealth: "healthy",
        openAlerts: 0,
        analysis: { recommendations: ["All components healthy"], operationalRisks: [] },
      },
      builder: {
        executionHealth: "healthy",
        grandKingSummary: "Builder executing P7-07",
        analysis: { recommendations: ["Complete explainability assembler"] },
      },
      recovery: {
        currentIncident: "None",
        grandKingSummary: "No active recovery",
        analysis: { recommendations: [] },
      },
      eta: {
        reason: "Progress advancing steadily",
        recommendedAction: "Continue mission",
        confidencePercent: 78,
        lastEtaUpdate: new Date().toISOString(),
      },
      founderShell: {
        grandKingSummary: "Executive intelligence active",
        executiveHome: { recommendations: ["Review explainability panel"] },
      },
    });

    assert.equal(view.architectureVersion, "P7-07");
    assert.ok(view.currentRecommendation);
    assert.ok(view.recommendations.length >= 3);
    assert.equal(view.supervisor.system, "Supervisor");
    assert.equal(view.ecc.system, "ECC");
    assert.equal(view.vie.system, "VIE");
    assert.ok(view.systemsCovered.includes("Pillow"));
    assert.ok(view.currentRecommendation!.why.length > 0);
    assert.ok(view.currentRecommendation!.evidence.length > 0);
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackExplainabilityArchitecture();
    assert.equal(view.architectureVersion, "P7-07");
    assert.match(view.grandKingSummary, /Pillow/i);
  });
});
