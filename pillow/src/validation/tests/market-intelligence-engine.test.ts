import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { assembleCorporateVisionEngine } from "../../corporate-vision-engine/assembler.js";
import { assembleExecutiveArchitectureFramework } from "../../executive-architecture-framework/assembler.js";
import { assembleStrategicObjectiveEngine } from "../../strategic-objective-engine/assembler.js";
import { assembleExecutiveFinanceFramework } from "../../executive-finance-framework/assembler.js";
import { assembleKnowledgeEvolutionArchitecture } from "../../knowledge-evolution-architecture/assembler.js";
import {
  assembleMarketIntelligenceEngine,
  buildFallbackMarketIntelligenceEngine,
  MARKET_INTELLIGENCE_PIPELINE,
  MARKET_PRINCIPLES,
  GOVERNED_MARKET_DOMAINS,
  MARKET_ANALYSIS_DOMAINS,
  PILLOW_MARKET_EVALUATIONS,
} from "../../market-intelligence-engine/index.js";

describe("E4-01 Market Intelligence Engine", () => {
  test("buildFallbackMarketIntelligenceEngine returns constitutional market model", () => {
    const view = buildFallbackMarketIntelligenceEngine();
    assert.equal(view.engineVersion, "E4-01");
    assert.equal(view.marketIntelligencePipeline.length, MARKET_INTELLIGENCE_PIPELINE.length);
    assert.deepEqual(view.marketPrinciples, [...MARKET_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_MARKET_DOMAINS.length);
    assert.ok(view.globalMarkets.length >= 10);
    assert.ok(view.marketTrends.length >= 1);
    assert.ok(view.emergingOpportunities.length >= 1);
    assert.ok(view.marketAnalysis.length, MARKET_ANALYSIS_DOMAINS.length);
    assert.ok(view.pillowEvaluations.length, PILLOW_MARKET_EVALUATIONS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE402, true);
    assert.ok(view.globalMarkets.every((m) => m.marketId && m.evidence.length >= 1));
  });

  test("assembleMarketIntelligenceEngine integrates E3 E2 E1 P9-02", () => {
    const executiveArchitecture = assembleExecutiveArchitectureFramework({});
    const corporateVision = assembleCorporateVisionEngine({
      executiveArchitecture,
      vie: { visionAlignment: "aligned", approvalStatus: "validated" },
    });
    const strategicObjectives = assembleStrategicObjectiveEngine({ corporateVision });
    const executivePlanningCertification = buildFallbackExecutivePlanningCertification();
    const executiveFinanceFramework = assembleExecutiveFinanceFramework({
      executiveArchitecture,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
    });
    const financialExecutiveCertification = buildFallbackFinancialExecutiveCertification();
    const executiveDecisionCertification = buildFallbackExecutiveDecisionCertification();
    const knowledgeEvolution = assembleKnowledgeEvolutionArchitecture({
      corporateVision,
      journey: { currentMission: "E4-01 Market Intelligence Engine" },
    });

    const view = assembleMarketIntelligenceEngine({
      financialExecutiveCertification,
      executiveDecisionCertification,
      executiveFinanceFramework,
      corporateVision,
      strategicObjectives,
      executivePlanningCertification,
      knowledgeEvolution,
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E4-01 Market Intelligence Engine" },
      supervisor: { status: "monitoring market intelligence" },
      ecc: { status: "market intelligence distribution" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E4-01");
    assert.ok(view.integrations.financialExecutiveCertification.includes("E3"));
    assert.ok(view.integrations.corporateVisionEngine.includes("E1-02"));
    assert.ok(view.integrations.knowledgeEvolution.includes("P9-02"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.strategicAlerts.length >= 1);
    assert.ok(view.economicIndicators.length >= 1);
    assert.equal(view.readyForE402, true);
  });
});
