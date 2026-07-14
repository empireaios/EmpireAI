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
import {
  assembleExecutiveApprovalIntelligence,
  buildFallbackExecutiveApprovalIntelligence,
  APPROVAL_PIPELINE,
  APPROVAL_PRINCIPLES,
  GOVERNED_APPROVAL_DOMAINS,
  APPROVAL_RULES,
  APPROVAL_LEVELS,
  ESCALATION_TRIGGERS,
} from "../../executive-approval-intelligence/index.js";

describe("E2-07 Executive Approval Intelligence", () => {
  test("buildFallbackExecutiveApprovalIntelligence returns constitutional approval model", () => {
    const view = buildFallbackExecutiveApprovalIntelligence();
    assert.equal(view.intelligenceVersion, "E2-07");
    assert.equal(view.approvalPipeline.length, APPROVAL_PIPELINE.length);
    assert.deepEqual(view.approvalPrinciples, [...APPROVAL_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_APPROVAL_DOMAINS.length);
    assert.ok(view.pendingApprovals.length >= 8);
    assert.ok(view.approvalQueue.length >= 1);
    assert.equal(view.approvalRules.length, APPROVAL_RULES.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE208, true);
    assert.ok(APPROVAL_LEVELS.length >= 7);
    assert.ok(ESCALATION_TRIGGERS.length >= 5);
  });

  test("assembleExecutiveApprovalIntelligence integrates E2-01 through E2-06", () => {
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

    const view = assembleExecutiveApprovalIntelligence({
      executiveDecisionArchitecture,
      riskAssessmentEngine,
      decisionSimulationEngine,
      executiveRecommendationEngine,
      conflictResolutionEngine,
      resourceAllocationEngine,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      journey: { currentMission: "E2-07 Executive Approval Intelligence" },
      supervisor: { status: "monitoring approvals" },
      ecc: { status: "approval queue coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.intelligenceVersion, "E2-07");
    assert.ok(view.integrations.conflictResolutionEngine.includes("E2-06"));
    assert.ok(view.integrations.pillowApprovalGates.includes("Pillow Approval Gate"));
    assert.ok(view.pillowEvaluations.length >= 5);
    assert.ok(view.pendingApprovals.every((a) => a.recommendedAuthority.length > 0));
  });
});
