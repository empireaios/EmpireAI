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
import { assembleExecutiveConfidenceEngine } from "../../executive-confidence-engine/assembler.js";
import { assembleAutonomousDecisionMonitor } from "../../autonomous-decision-monitor/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleExecutiveDecisionCertification,
  buildFallbackExecutiveDecisionCertification,
  EDEC_CERTIFICATION_SCOPE,
  EDEC_CERTIFICATION_GATES,
  EDEC_CERTIFICATION_VALIDATIONS,
} from "../../executive-decision-certification/index.js";

describe("E2-16 Executive Decision Certification", () => {
  test("buildFallbackExecutiveDecisionCertification returns constitutional certification model", () => {
    const view = buildFallbackExecutiveDecisionCertification();
    assert.equal(view.architectureVersion, "E2-16");
    assert.equal(view.certificationScope.length, EDEC_CERTIFICATION_SCOPE.length);
    assert.equal(view.certificationGates.length, EDEC_CERTIFICATION_GATES.length);
    assert.equal(view.certificationValidations.length, EDEC_CERTIFICATION_VALIDATIONS.length);
    assert.ok(view.certificationScope.filter((s) => s.status === "certified").length >= 15);
    assert.equal(view.gatesTotal, 17);
    assert.equal(view.programmeCertified, true);
    assert.equal(view.phaseE2Completed, true);
    assert.equal(view.allGatesPassed, true);
    assert.equal(view.criticalDefectCount, 0);
    assert.equal(view.readyForE301, true);
    assert.equal(view.nextMission, "E3-01 Executive Finance Framework");
  });

  test("assembleExecutiveDecisionCertification integrates E2-01 through E2-15", () => {
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
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({});
    const decisionAuditEngine = assembleDecisionAuditEngine({
      executiveDecisionArchitecture,
      executivePolicyEngine,
      executiveRecommendationEngine,
      executiveApprovalIntelligence,
      knowledgeEvolution,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-16" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });
    const executiveConfidenceEngine = assembleExecutiveConfidenceEngine({
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
      journey: { currentMission: "E2-16" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });
    const autonomousDecisionMonitor = assembleAutonomousDecisionMonitor({
      executiveDecisionArchitecture,
      decisionAuditEngine,
      executiveConfidenceEngine,
      executiveRecommendationEngine,
      executivePolicyEngine,
      knowledgeEvolution,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-16" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });
    const view = assembleExecutiveDecisionCertification({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      resourceAllocationEngine,
      conflictResolutionEngine,
      executiveApprovalIntelligence,
      crisisDecisionEngine,
      executiveEscalationEngine,
      tradeOffAnalysisEngine,
      executiveConsensusEngine,
      executivePolicyEngine,
      decisionAuditEngine,
      executiveConfidenceEngine,
      autonomousDecisionMonitor,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-16" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E2-16");
    assert.equal(view.certificationGates.every((g) => g.result === "PASS"), true);
    assert.equal(view.programmeCertified, true);
    assert.equal(view.phaseE2Completed, true);
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.autonomousDecisionMonitor.includes("E2-15"));
    assert.equal(view.readyForE301, true);
  });
});
