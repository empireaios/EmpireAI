import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveRoadmapEngine } from "../../executive-roadmap-engine/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { assembleExecutiveDecisionArchitecture } from "../../executive-decision-architecture/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { assembleRiskAssessmentEngine } from "../../risk-assessment-engine/assembler.js";
import { assembleDecisionSimulationEngine } from "../../decision-simulation-engine/assembler.js";
import { assembleExecutiveRecommendationEngine } from "../../executive-recommendation-engine/assembler.js";
import { assembleResourceAllocationEngine } from "../../resource-allocation-engine/assembler.js";
import { assembleOpportunityPrioritizationEngine } from "../../opportunity-prioritization-engine/assembler.js";
import {
  assembleExecutiveFinanceFramework,
  buildFallbackExecutiveFinanceFramework,
  FINANCIAL_PIPELINE,
  FINANCIAL_PRINCIPLES,
  GOVERNED_FINANCE_DOMAINS,
  FINANCIAL_GOVERNANCE_DOMAINS,
} from "../../executive-finance-framework/index.js";

describe("E3-01 Executive Finance Framework", () => {
  test("buildFallbackExecutiveFinanceFramework returns constitutional finance model", () => {
    const view = buildFallbackExecutiveFinanceFramework();
    assert.equal(view.frameworkVersion, "E3-01");
    assert.equal(view.financialPipeline.length, FINANCIAL_PIPELINE.length);
    assert.deepEqual(view.financialPrinciples, [...FINANCIAL_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_FINANCE_DOMAINS.length);
    assert.ok(view.financialEntities.length >= 10);
    assert.ok(view.capitalPosition.length >= FINANCIAL_GOVERNANCE_DOMAINS.length);
    assert.ok(view.budgetStatus.length >= 1);
    assert.ok(view.financialRisks.length >= 1);
    assert.ok(view.financialGovernance.length >= FINANCIAL_GOVERNANCE_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE302, true);
  });

  test("assembleExecutiveFinanceFramework integrates E1 E2 planning and decision engines", () => {
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
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
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
    const opportunityPrioritization = assembleOpportunityPrioritizationEngine({
      corporateVision,
      strategicObjectives,
      executiveRoadmap,
      executivePlanningCertification,
    });
    const view = assembleExecutiveFinanceFramework({
      corporateVision,
      strategicObjectives,
      executiveDecisionArchitecture,
      executiveDecisionCertification,
      executivePlanningCertification,
      resourceAllocationEngine,
      executiveRecommendationEngine,
      opportunityPrioritization,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-01" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.frameworkVersion, "E3-01");
    assert.ok(view.integrations.executivePlanningProgramme.includes("E1"));
    assert.ok(view.integrations.executiveDecisionEngine.includes("E2"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.resourceAllocationEngine.includes("E2-05"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.financialEntities.every((e) => e.financialId && e.title && e.evidence.length >= 1));
    assert.equal(view.readyForE302, true);
  });
});
