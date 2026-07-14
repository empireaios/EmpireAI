import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackMarketIntelligenceEngine } from "../../market-intelligence-engine/assembler.js";
import { buildFallbackCompetitorIntelligenceEngine } from "../../competitor-intelligence-engine/assembler.js";
import { buildFallbackOpportunityDiscoveryEngine } from "../../opportunity-discovery-engine/assembler.js";
import { buildFallbackThreatDetectionEngine } from "../../threat-detection-engine/assembler.js";
import { buildFallbackIndustryIntelligenceEngine } from "../../industry-intelligence-engine/assembler.js";
import { buildFallbackCustomerBehaviourIntelligence } from "../../customer-behaviour-intelligence/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleInnovationIntelligenceEngine,
  buildFallbackInnovationIntelligenceEngine,
  INNOVATION_INTELLIGENCE_PIPELINE,
  INNOVATION_INTELLIGENCE_PRINCIPLES,
  GOVERNED_INNOVATION_DOMAINS,
  INNOVATION_ANALYSIS_DOMAINS,
  PILLOW_INNOVATION_EVALUATIONS,
} from "../../innovation-intelligence-engine/index.js";

describe("E4-07 Innovation Intelligence Engine", () => {
  test("buildFallbackInnovationIntelligenceEngine returns constitutional innovation model", () => {
    const view = buildFallbackInnovationIntelligenceEngine();
    assert.equal(view.engineVersion, "E4-07");
    assert.equal(view.innovationIntelligencePipeline.length, INNOVATION_INTELLIGENCE_PIPELINE.length);
    assert.deepEqual(view.innovationPrinciples, [...INNOVATION_INTELLIGENCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_INNOVATION_DOMAINS.length);
    assert.ok(view.innovationPipeline.length >= 10);
    assert.ok(view.disruptiveInnovations.length >= 1);
    assert.ok(view.emergingTechnologies.length >= 1);
    assert.ok(view.innovationAnalysis.length, INNOVATION_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_INNOVATION_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.strategicOpportunities.length >= 1);
    assert.equal(view.readyForE408, true);
    assert.ok(view.innovationPipeline.every((i) => i.innovationId && i.evidence.length >= 1));
  });

  test("assembleInnovationIntelligenceEngine integrates E4-01 E4-06 E3 E2 E1 P9-02", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const marketIntelligenceEngine = buildFallbackMarketIntelligenceEngine();
    const competitorIntelligenceEngine = buildFallbackCompetitorIntelligenceEngine();
    const opportunityDiscoveryEngine = buildFallbackOpportunityDiscoveryEngine();
    const threatDetectionEngine = buildFallbackThreatDetectionEngine();
    const industryIntelligenceEngine = buildFallbackIndustryIntelligenceEngine();
    const customerBehaviourIntelligence = buildFallbackCustomerBehaviourIntelligence();
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-07 Innovation Intelligence Engine" },
    });

    const view = assembleInnovationIntelligenceEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      industryIntelligenceEngine,
      customerBehaviourIntelligence,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-07 Innovation Intelligence Engine" },
      supervisor: { status: "monitoring innovation intelligence" },
      ecc: { status: "innovation intelligence coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-07");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.industryIntelligenceEngine.includes("E4-05"));
    assert.ok(view.integrations.customerBehaviourIntelligence.includes("E4-06"));
    assert.ok(view.integrations.opportunityDiscoveryEngine.includes("E4-03"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.innovationReadiness.length >= 1);
    assert.ok(view.businessImpact.length >= 1);
    assert.equal(view.readyForE408, true);
  });
});
