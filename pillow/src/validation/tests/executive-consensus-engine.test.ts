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
import {
  assembleExecutiveConsensusEngine,
  buildFallbackExecutiveConsensusEngine,
  CONSENSUS_PIPELINE,
  CONSENSUS_PRINCIPLES,
  GOVERNED_CONSENSUS_DOMAINS,
  CONSENSUS_PARTICIPANTS,
  CONSENSUS_ANALYSIS_DIMENSIONS,
} from "../../executive-consensus-engine/index.js";

describe("E2-11 Executive Consensus Engine", () => {
  test("buildFallbackExecutiveConsensusEngine returns constitutional consensus model", () => {
    const view = buildFallbackExecutiveConsensusEngine();
    assert.equal(view.engineVersion, "E2-11");
    assert.equal(view.consensusPipeline.length, CONSENSUS_PIPELINE.length);
    assert.deepEqual(view.consensusPrinciples, [...CONSENSUS_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CONSENSUS_DOMAINS.length);
    assert.ok(view.activeConsensus.length >= 8);
    assert.ok(view.executivePerspectives.length >= CONSENSUS_PARTICIPANTS.length);
    assert.ok(view.agreementAreas.length >= 1);
    assert.ok(view.disagreementAreas.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE212, true);
    assert.ok(CONSENSUS_ANALYSIS_DIMENSIONS.length >= 9);
  });

  test("assembleExecutiveConsensusEngine integrates E2-01 E2-02 E2-03 E2-04 E2-10", () => {
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
    const view = assembleExecutiveConsensusEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      tradeOffAnalysisEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-11 Executive Consensus Engine" },
      supervisor: { status: "monitoring consensus progress" },
      ecc: { status: "consensus workflow coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-11");
    assert.ok(view.integrations.tradeOffAnalysisEngine.includes("E2-10"));
    assert.ok(view.integrations.decisionSimulationEngine.includes("E2-03"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.pillowEvaluations.length >= 5);
    assert.ok(view.activeConsensus.every((c) => c.recommendedDecision.length >= 1));
  });
});
