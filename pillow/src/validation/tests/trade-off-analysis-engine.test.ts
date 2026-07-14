import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { assembleExecutiveDecisionArchitecture } from "../../executive-decision-architecture/assembler.js";
import { assembleRiskAssessmentEngine } from "../../risk-assessment-engine/assembler.js";
import { assembleDecisionSimulationEngine } from "../../decision-simulation-engine/assembler.js";
import { assembleExecutiveRecommendationEngine } from "../../executive-recommendation-engine/assembler.js";
import { assembleResourceAllocationEngine } from "../../resource-allocation-engine/assembler.js";
import { assembleConflictResolutionEngine } from "../../conflict-resolution-engine/assembler.js";
import { assembleExecutiveApprovalIntelligence } from "../../executive-approval-intelligence/assembler.js";
import { assembleCrisisDecisionEngine } from "../../crisis-decision-engine/assembler.js";
import { assembleExecutiveEscalationEngine } from "../../executive-escalation-engine/assembler.js";
import {
  assembleTradeOffAnalysisEngine,
  buildFallbackTradeOffAnalysisEngine,
  TRADEOFF_PIPELINE,
  TRADEOFF_PRINCIPLES,
  GOVERNED_TRADEOFF_DOMAINS,
  TRADEOFF_DIMENSIONS,
} from "../../trade-off-analysis-engine/index.js";

describe("E2-10 Trade-off Analysis Engine", () => {
  test("buildFallbackTradeOffAnalysisEngine returns constitutional trade-off model", () => {
    const view = buildFallbackTradeOffAnalysisEngine();
    assert.equal(view.engineVersion, "E2-10");
    assert.equal(view.tradeOffPipeline.length, TRADEOFF_PIPELINE.length);
    assert.deepEqual(view.tradeOffPrinciples, [...TRADEOFF_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_TRADEOFF_DOMAINS.length);
    assert.ok(view.tradeOffAnalyses.length >= 8);
    assert.ok(view.decisionAlternatives.length >= 10);
    assert.ok(view.tradeOffComparisons.length >= 1);
    assert.ok(view.tradeOffScoring.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE211, true);
    assert.ok(TRADEOFF_DIMENSIONS.length >= 11);
  });

  test("assembleTradeOffAnalysisEngine integrates E2-01 E2-02 E2-03 E2-04 E2-09", () => {
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
    const riskAssessmentEngine = assembleRiskAssessmentEngine({
      executiveDecisionArchitecture,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const decisionSimulationEngine = assembleDecisionSimulationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const executiveRecommendationEngine = assembleExecutiveRecommendationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const resourceAllocationEngine = assembleResourceAllocationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const conflictResolutionEngine = assembleConflictResolutionEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      resourceAllocationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const executiveApprovalIntelligence = assembleExecutiveApprovalIntelligence({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      conflictResolutionEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const crisisDecisionEngine = assembleCrisisDecisionEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      executiveApprovalIntelligence,
      conflictResolutionEngine,
      guardian: { status: "monitoring", health: "95/100" },
    });
    const executiveEscalationEngine = assembleExecutiveEscalationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      executiveApprovalIntelligence,
      crisisDecisionEngine,
      conflictResolutionEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
    });
    const view = assembleTradeOffAnalysisEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      executiveEscalationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-10 Trade-off Analysis Engine" },
      supervisor: { status: "monitoring trade-off analysis" },
      ecc: { status: "alternative planning coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-10");
    assert.ok(view.integrations.decisionSimulationEngine.includes("E2-03"));
    assert.ok(view.integrations.executiveRecommendationEngine.includes("E2-04"));
    assert.ok(view.integrations.executiveEscalationEngine.includes("E2-09"));
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.decisionAlternatives.some((a) => a.recommended));
  });
});
