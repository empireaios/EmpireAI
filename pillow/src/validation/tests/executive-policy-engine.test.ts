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
import {
  assembleExecutivePolicyEngine,
  buildFallbackExecutivePolicyEngine,
  POLICY_PIPELINE,
  POLICY_PRINCIPLES,
  GOVERNED_POLICY_DOMAINS,
  POLICY_CLASSIFICATIONS,
  POLICY_VALIDATION_DOMAINS,
} from "../../executive-policy-engine/index.js";

describe("E2-12 Executive Policy Engine", () => {
  test("buildFallbackExecutivePolicyEngine returns constitutional policy model", () => {
    const view = buildFallbackExecutivePolicyEngine();
    assert.equal(view.engineVersion, "E2-12");
    assert.equal(view.policyPipeline.length, POLICY_PIPELINE.length);
    assert.deepEqual(view.policyPrinciples, [...POLICY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_POLICY_DOMAINS.length);
    assert.ok(view.activePolicies.length >= 12);
    assert.ok(view.policyCompliance.length >= 1);
    assert.ok(view.policyValidation.length >= POLICY_VALIDATION_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE213, true);
    assert.ok(POLICY_CLASSIFICATIONS.length >= 12);
  });

  test("assembleExecutivePolicyEngine integrates E2-01 E2-04 E2-07 E2-10 E2-11", () => {
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
    const view = assembleExecutivePolicyEngine({
      executiveDecisionArchitecture,
      executiveConsensusEngine,
      tradeOffAnalysisEngine,
      executiveRecommendationEngine,
      executiveApprovalIntelligence,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-12 Executive Policy Engine" },
      supervisor: { status: "monitoring policy compliance" },
      ecc: { status: "policy enforcement coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-12");
    assert.ok(view.integrations.executiveConsensusEngine.includes("E2-11"));
    assert.ok(view.integrations.tradeOffAnalysisEngine.includes("E2-10"));
    assert.ok(view.integrations.executiveApprovalIntelligence.includes("E2-07"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.pillowEvaluations.length >= 5);
    assert.ok(view.activePolicies.every((p) => p.complianceRules.length >= 1));
  });
});
