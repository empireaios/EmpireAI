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
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleAutonomousDecisionMonitor,
  buildFallbackAutonomousDecisionMonitor,
  MONITORING_PIPELINE,
  MONITORING_PRINCIPLES,
  GOVERNED_MONITOR_DOMAINS,
  MONITORING_CAPABILITIES,
  AUTONOMOUS_ACTIONS,
} from "../../autonomous-decision-monitor/index.js";

describe("E2-15 Autonomous Decision Monitor", () => {
  test("buildFallbackAutonomousDecisionMonitor returns constitutional monitoring model", () => {
    const view = buildFallbackAutonomousDecisionMonitor();
    assert.equal(view.engineVersion, "E2-15");
    assert.equal(view.monitoringPipeline.length, MONITORING_PIPELINE.length);
    assert.deepEqual(view.monitoringPrinciples, [...MONITORING_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_MONITOR_DOMAINS.length);
    assert.ok(view.monitoredDecisions.length >= 10);
    assert.ok(view.monitoringCapabilities.length >= MONITORING_CAPABILITIES.length);
    assert.ok(view.executiveAlerts.length >= 0);
    assert.ok(view.correctiveActions.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE216, true);
    assert.ok(MONITORING_CAPABILITIES.length >= 10);
    assert.ok(AUTONOMOUS_ACTIONS.length >= 8);
  });

  test("assembleAutonomousDecisionMonitor integrates E2-01 E2-04 E2-12 E2-13 E2-14 P9-02", () => {
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
      knowledgeEvolution: assembleKnowledgeEvolutionArchitecture({}),
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-15" },
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
      knowledgeEvolution: assembleKnowledgeEvolutionArchitecture({}),
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-15" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });
    const view = assembleAutonomousDecisionMonitor({
      executiveDecisionArchitecture,
      decisionAuditEngine,
      executiveConfidenceEngine,
      executiveRecommendationEngine,
      executivePolicyEngine,
      knowledgeEvolution: assembleKnowledgeEvolutionArchitecture({}),
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-15" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-15");
    assert.ok(view.integrations.executiveDecisionArchitecture.includes("E2-01"));
    assert.ok(view.integrations.decisionAuditEngine.includes("E2-13"));
    assert.ok(view.integrations.executiveConfidenceEngine.includes("E2-14"));
    assert.ok(view.integrations.executiveRecommendationEngine.includes("E2-04"));
    assert.ok(view.integrations.executivePolicyEngine.includes("E2-12"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.monitoredDecisions.every((d) => d.monitorId && d.decisionId));
    assert.ok(view.monitoredDecisions.every((d) => d.expectedOutcome && d.actualOutcome));
    assert.equal(view.readyForE216, true);
  });
});
