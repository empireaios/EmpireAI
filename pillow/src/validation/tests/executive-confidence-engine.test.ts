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
import { assembleTradeOffAnalysisEngine } from "../../trade-off-analysis-engine/assembler.js";
import { assembleExecutiveConsensusEngine } from "../../executive-consensus-engine/assembler.js";
import { assembleExecutivePolicyEngine } from "../../executive-policy-engine/assembler.js";
import { assembleDecisionAuditEngine } from "../../decision-audit-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutiveConfidenceEngine,
  buildFallbackExecutiveConfidenceEngine,
  CONFIDENCE_PIPELINE,
  CONFIDENCE_PRINCIPLES,
  GOVERNED_CONFIDENCE_DOMAINS,
  CONFIDENCE_LEVELS,
  CONFIDENCE_CALCULATION_DOMAINS,
} from "../../executive-confidence-engine/index.js";

describe("E2-14 Executive Confidence Engine", () => {
  test("buildFallbackExecutiveConfidenceEngine returns constitutional confidence model", () => {
    const view = buildFallbackExecutiveConfidenceEngine();
    assert.equal(view.engineVersion, "E2-14");
    assert.equal(view.confidencePipeline.length, CONFIDENCE_PIPELINE.length);
    assert.deepEqual(view.confidencePrinciples, [...CONFIDENCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CONFIDENCE_DOMAINS.length);
    assert.ok(view.confidenceAssessments.length >= 10);
    assert.ok(view.confidenceDrivers.length >= CONFIDENCE_CALCULATION_DOMAINS.length);
    assert.ok(view.confidenceCalibration.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE215, true);
    assert.ok(CONFIDENCE_LEVELS.length >= 6);
  });

  test("assembleExecutiveConfidenceEngine integrates E2-01 E2-02 E2-03 E2-04 E2-13 P9-02", () => {
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
    const tradeOffAnalysisEngine = assembleTradeOffAnalysisEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      executiveEscalationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const executiveConsensusEngine = assembleExecutiveConsensusEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      tradeOffAnalysisEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      vie: { approvalStatus: "validated" },
    });
    const executivePolicyEngine = assembleExecutivePolicyEngine({
      executiveDecisionArchitecture,
      executiveConsensusEngine,
      tradeOffAnalysisEngine,
      executiveRecommendationEngine,
      executiveApprovalIntelligence,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      vie: { approvalStatus: "validated" },
    });
    const decisionAuditEngine = assembleDecisionAuditEngine({
      executiveDecisionArchitecture,
      executivePolicyEngine,
      executiveRecommendationEngine,
      executiveApprovalIntelligence,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      vie: { approvalStatus: "validated" },
    });
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E2-14 Executive Confidence Engine" },
    });
    const view = assembleExecutiveConfidenceEngine({
      executiveDecisionArchitecture,
      decisionAuditEngine,
      executiveRecommendationEngine,
      decisionSimulationEngine,
      riskAssessmentEngine,
      knowledgeEvolution,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-14 Executive Confidence Engine" },
      supervisor: { status: "monitoring confidence health" },
      ecc: { status: "confidence publication coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-14");
    assert.ok(view.integrations.decisionAuditEngine.includes("E2-13"));
    assert.ok(view.integrations.decisionSimulationEngine.includes("E2-03"));
    assert.ok(view.integrations.riskAssessmentEngine.includes("E2-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.pillowEvaluations.length >= 6);
    assert.ok(view.confidenceAssessments.every((a) => a.supportingFactors.length >= 1));
    assert.ok(view.averageConfidenceScore >= 70);
  });
});
