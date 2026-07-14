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
import {
  assembleExecutiveEscalationEngine,
  buildFallbackExecutiveEscalationEngine,
  ESCALATION_PIPELINE,
  ESCALATION_PRINCIPLES,
  GOVERNED_ESCALATION_DOMAINS,
  ESCALATION_LEVELS,
  ESCALATION_RULE_DOMAINS,
} from "../../executive-escalation-engine/index.js";

describe("E2-09 Executive Escalation Engine", () => {
  test("buildFallbackExecutiveEscalationEngine returns constitutional escalation model", () => {
    const view = buildFallbackExecutiveEscalationEngine();
    assert.equal(view.engineVersion, "E2-09");
    assert.equal(view.escalationPipeline.length, ESCALATION_PIPELINE.length);
    assert.deepEqual(view.escalationPrinciples, [...ESCALATION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ESCALATION_DOMAINS.length);
    assert.ok(view.activeEscalations.length >= 10);
    assert.ok(view.escalationQueue.length >= 1);
    assert.ok(view.authorityRouting.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE210, true);
    assert.ok(ESCALATION_LEVELS.length >= 7);
    assert.ok(ESCALATION_RULE_DOMAINS.length >= 8);
  });

  test("assembleExecutiveEscalationEngine integrates E2-01 E2-02 E2-07 E2-08", () => {
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
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
    });
    const view = assembleExecutiveEscalationEngine({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      executiveApprovalIntelligence,
      crisisDecisionEngine,
      conflictResolutionEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E2-09 Executive Escalation Engine" },
      supervisor: { status: "monitoring escalation queue" },
      ecc: { status: "escalation routing coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E2-09");
    assert.ok(view.integrations.executiveApprovalIntelligence.includes("E2-07"));
    assert.ok(view.integrations.crisisDecisionEngine.includes("E2-08"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.pillowEvaluations.length >= 5);
    assert.ok(view.activeEscalations.every((e) => e.recommendedAction.length >= 1));
  });
});
