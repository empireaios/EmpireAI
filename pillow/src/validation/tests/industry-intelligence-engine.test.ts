import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackMarketIntelligenceEngine } from "../../market-intelligence-engine/assembler.js";
import { buildFallbackCompetitorIntelligenceEngine } from "../../competitor-intelligence-engine/assembler.js";
import { buildFallbackOpportunityDiscoveryEngine } from "../../opportunity-discovery-engine/assembler.js";
import { buildFallbackThreatDetectionEngine } from "../../threat-detection-engine/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleIndustryIntelligenceEngine,
  buildFallbackIndustryIntelligenceEngine,
  INDUSTRY_INTELLIGENCE_PIPELINE,
  INDUSTRY_INTELLIGENCE_PRINCIPLES,
  GOVERNED_INDUSTRY_DOMAINS,
  INDUSTRY_ANALYSIS_DOMAINS,
  PILLOW_INDUSTRY_EVALUATIONS,
} from "../../industry-intelligence-engine/index.js";

describe("E4-05 Industry Intelligence Engine", () => {
  test("buildFallbackIndustryIntelligenceEngine returns constitutional industry model", () => {
    const view = buildFallbackIndustryIntelligenceEngine();
    assert.equal(view.engineVersion, "E4-05");
    assert.equal(view.industryIntelligencePipeline.length, INDUSTRY_INTELLIGENCE_PIPELINE.length);
    assert.deepEqual(view.industryPrinciples, [...INDUSTRY_INTELLIGENCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_INDUSTRY_DOMAINS.length);
    assert.ok(view.industryLandscape.length >= 10);
    assert.ok(view.growthIndustries.length >= 1);
    assert.ok(view.emergingIndustries.length >= 1);
    assert.ok(view.industryAnalysis.length, INDUSTRY_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_INDUSTRY_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.ok(view.innovationActivity.length >= 1);
    assert.equal(view.readyForE406, true);
    assert.ok(view.industryLandscape.every((i) => i.industryId && i.evidence.length >= 1));
  });

  test("assembleIndustryIntelligenceEngine integrates E4-01 E4-02 E4-03 E4-04 E3 E2 E1 P9-02", () => {
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
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-05 Industry Intelligence Engine" },
    });

    const view = assembleIndustryIntelligenceEngine({
      marketIntelligenceEngine,
      competitorIntelligenceEngine,
      opportunityDiscoveryEngine,
      threatDetectionEngine,
      financialExecutiveCertification,
      executiveDecisionCertification,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-05 Industry Intelligence Engine" },
      supervisor: { status: "monitoring industry intelligence" },
      ecc: { status: "industry intelligence coordination" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-05");
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.competitorIntelligenceEngine.includes("E4-02"));
    assert.ok(view.integrations.opportunityDiscoveryEngine.includes("E4-03"));
    assert.ok(view.integrations.threatDetectionEngine.includes("E4-04"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.industryTrends.length >= 1);
    assert.ok(view.industryOpportunities.length >= 1);
    assert.equal(view.readyForE406, true);
  });
});
