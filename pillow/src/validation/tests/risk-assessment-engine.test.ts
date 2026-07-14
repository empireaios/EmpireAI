import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { assembleExecutiveDecisionArchitecture } from "../../executive-decision-architecture/assembler.js";
import {
  assembleRiskAssessmentEngine,
  buildFallbackRiskAssessmentEngine,
  RISK_PIPELINE,
  RISK_PRINCIPLES,
  GOVERNED_RISK_DOMAINS,
  RISK_SCORING_DIMENSIONS,
} from "../../risk-assessment-engine/index.js";

describe("E2-02 Risk Assessment Engine", () => {
  test("buildFallbackRiskAssessmentEngine returns constitutional risk model", () => {
    const view = buildFallbackRiskAssessmentEngine();
    assert.equal(view.engineVersion, "E2-02");
    assert.equal(view.riskPipeline.length, RISK_PIPELINE.length);
    assert.deepEqual(view.riskPrinciples, [...RISK_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_RISK_DOMAINS.length);
    assert.ok(view.currentRisks.length >= 6);
    assert.ok(view.criticalRisks.length >= 1);
    assert.equal(view.riskScores.length, RISK_SCORING_DIMENSIONS.length);
    assert.ok(view.mitigationStatus.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE203, true);
  });

  test("assembleRiskAssessmentEngine integrates E2-01 decision architecture", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const executiveRoadmap = assembleExecutiveRoadmapEngine({ corporateVision, strategicObjectives });
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const executiveDecisionArchitecture = assembleExecutiveDecisionArchitecture({
      executiveArchitecture,
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executivePlanningCertification,
    });

    const view = assembleRiskAssessmentEngine({
      executiveDecisionArchitecture,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-02 Risk Assessment Engine" },
      supervisor: { status: "monitoring risks" },
      ecc: { status: "risk mitigation coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-02");
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.currentRisks.every((r) => r.overallRiskScore >= 0 && r.overallRiskScore <= 100));
  });
});
