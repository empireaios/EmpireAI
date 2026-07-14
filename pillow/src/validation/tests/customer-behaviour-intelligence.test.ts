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
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleCustomerBehaviourIntelligence,
  buildFallbackCustomerBehaviourIntelligence,
  CUSTOMER_INTELLIGENCE_PIPELINE,
  CUSTOMER_BEHAVIOUR_PRINCIPLES,
  GOVERNED_CUSTOMER_DOMAINS,
  CUSTOMER_ANALYSIS_DOMAINS,
  PILLOW_CUSTOMER_EVALUATIONS,
} from "../../customer-behaviour-intelligence/index.js";

describe("E4-06 Customer Behaviour Intelligence", () => {
  test("buildFallbackCustomerBehaviourIntelligence returns constitutional customer model", () => {
    const view = buildFallbackCustomerBehaviourIntelligence();
    assert.equal(view.engineVersion, "E4-06");
    assert.equal(view.customerIntelligencePipeline.length, CUSTOMER_INTELLIGENCE_PIPELINE.length);
    assert.deepEqual(view.customerPrinciples, [...CUSTOMER_BEHAVIOUR_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CUSTOMER_DOMAINS.length);
    assert.ok(view.customerInsights.length >= 10);
    assert.ok(view.customerSegments.length >= 1);
    assert.ok(view.purchaseIntent.length >= 1);
    assert.ok(view.customerAnalysis.length, CUSTOMER_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_CUSTOMER_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.growthOpportunities.length >= 1);
    assert.equal(view.readyForE407, true);
    assert.ok(view.customerInsights.every((c) => c.customerInsightId && c.evidence.length >= 1));
  });

  test("assembleCustomerBehaviourIntelligence integrates E4-01 E4-05 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-06 Customer Behaviour Intelligence" },
    });

    const view = assembleCustomerBehaviourIntelligence({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      industryIntelligenceEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-06 Customer Behaviour Intelligence" },
      supervisor: { status: "monitoring customer intelligence" },
      ecc: { status: "customer intelligence coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-06");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.industryIntelligenceEngine.includes("E4-05"));
    assert.ok(view.integrations.opportunityDiscoveryEngine.includes("E4-03"));
    assert.ok(view.integrations.threatDetectionEngine.includes("E4-04"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.buyingTrends.length >= 1);
    assert.ok(view.retentionTrends.length >= 1);
    assert.equal(view.readyForE407, true);
  });
});
