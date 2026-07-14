import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleExecutiveFinanceFramework } from "../../executive-finance-framework/assembler.js";
import { assembleCapitalAllocationEngine } from "../../capital-allocation-engine/assembler.js";
import { assembleExecutiveBudgetPlanner } from "../../executive-budget-planner/assembler.js";
import { assembleInvestmentEvaluationEngine } from "../../investment-evaluation-engine/assembler.js";
import { assembleRoiIntelligenceEngine } from "../../roi-intelligence-engine/assembler.js";
import { assembleCashReserveIntelligence } from "../../cash-reserve-intelligence/assembler.js";
import { assembleProfitOptimizationEngine } from "../../profit-optimization-engine/assembler.js";
import { assembleCostOptimizationEngine } from "../../cost-optimization-engine/assembler.js";
import { assembleFinancialScenarioEngine } from "../../financial-scenario-engine/assembler.js";
import { assembleExecutiveKpiEngine } from "../../executive-kpi-engine/assembler.js";
import { assembleCapitalRiskEngine } from "../../capital-risk-engine/assembler.js";
import { assembleExecutiveForecastIntelligence } from "../../executive-forecast-intelligence/assembler.js";
import { assembleExecutivePerformanceDashboard } from "../../executive-performance-dashboard/assembler.js";
import { assembleEnterpriseValuationEngine } from "../../enterprise-valuation-engine/assembler.js";
import {
  assembleExecutiveCapitalStrategy,
  buildFallbackExecutiveCapitalStrategy,
  EXECUTIVE_CAPITAL_STRATEGY_PRINCIPLES,
  GOVERNED_CAPITAL_STRATEGY_DOMAINS,
  INVESTMENT_HORIZONS,
} from "../../executive-capital-strategy/index.js";

describe("E3-15 Executive Capital Strategy", () => {
  test("buildFallbackExecutiveCapitalStrategy returns long-term capital strategy authority", () => {
    const view = buildFallbackExecutiveCapitalStrategy();
    assert.equal(view.engineVersion, "E3-15");
    assert.ok(view.capitalStrategies.length >= 10);
    assert.deepEqual(view.strategyPrinciples, [...EXECUTIVE_CAPITAL_STRATEGY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CAPITAL_STRATEGY_DOMAINS.length);
    assert.equal(view.investmentHorizons.length, INVESTMENT_HORIZONS.length);
    assert.ok(view.allocationPriorities.length >= 5);
    assert.ok(view.preservationGrowthProfiles.length >= 5);
    assert.ok(view.strategicDeployments.length >= 4);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.preservationGrowthBand, "balanced");
    assert.equal(view.readyForE316, true);
  });

  test("assembleExecutiveCapitalStrategy integrates E3-01 through E3-14", () => {
    const executiveFinanceFramework = assembleExecutiveFinanceFramework({});
    const capitalAllocationEngine = assembleCapitalAllocationEngine({ executiveFinanceFramework });
    const executiveBudgetPlanner = assembleExecutiveBudgetPlanner({ executiveFinanceFramework, capitalAllocationEngine });
    const investmentEvaluationEngine = assembleInvestmentEvaluationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
    });
    const roiIntelligenceEngine = assembleRoiIntelligenceEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
    });
    const cashReserveIntelligence = assembleCashReserveIntelligence({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
    });
    const profitOptimizationEngine = assembleProfitOptimizationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
    });
    const costOptimizationEngine = assembleCostOptimizationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
    });
    const financialScenarioEngine = assembleFinancialScenarioEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
    });
    const executiveKpiEngine = assembleExecutiveKpiEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
      financialScenarioEngine,
    });
    const capitalRiskEngine = assembleCapitalRiskEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
      financialScenarioEngine,
      executiveKpiEngine,
    });
    const executiveForecastIntelligence = assembleExecutiveForecastIntelligence({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
      financialScenarioEngine,
      executiveKpiEngine,
      capitalRiskEngine,
    });
    const executivePerformanceDashboard = assembleExecutivePerformanceDashboard({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
      financialScenarioEngine,
      executiveKpiEngine,
      capitalRiskEngine,
      executiveForecastIntelligence,
    });
    const enterpriseValuationEngine = assembleEnterpriseValuationEngine({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
      financialScenarioEngine,
      executiveKpiEngine,
      capitalRiskEngine,
      executiveForecastIntelligence,
      executivePerformanceDashboard,
    });
    const view = assembleExecutiveCapitalStrategy({
      executiveFinanceFramework,
      capitalAllocationEngine,
      executiveBudgetPlanner,
      investmentEvaluationEngine,
      roiIntelligenceEngine,
      cashReserveIntelligence,
      profitOptimizationEngine,
      costOptimizationEngine,
      financialScenarioEngine,
      executiveKpiEngine,
      capitalRiskEngine,
      executiveForecastIntelligence,
      executivePerformanceDashboard,
      enterpriseValuationEngine,
    });

    assert.equal(view.engineVersion, "E3-15");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.capitalAllocationEngine.includes("E3-02"));
    assert.ok(view.integrations.executiveBudgetPlanner.includes("E3-03"));
    assert.ok(view.integrations.investmentEvaluationEngine.includes("E3-04"));
    assert.ok(view.integrations.roiIntelligenceEngine.includes("E3-05"));
    assert.ok(view.integrations.cashReserveIntelligence.includes("E3-06"));
    assert.ok(view.integrations.profitOptimizationEngine.includes("E3-07"));
    assert.ok(view.integrations.costOptimizationEngine.includes("E3-08"));
    assert.ok(view.integrations.financialScenarioEngine.includes("E3-09"));
    assert.ok(view.integrations.executiveKpiEngine.includes("E3-10"));
    assert.ok(view.integrations.capitalRiskEngine.includes("E3-11"));
    assert.ok(view.integrations.executiveForecastIntelligence.includes("E3-12"));
    assert.ok(view.integrations.executivePerformanceDashboard.includes("E3-13"));
    assert.ok(view.integrations.enterpriseValuationEngine.includes("E3-14"));
    assert.equal(view.enterpriseValueAnchor, enterpriseValuationEngine.estimatedEnterpriseValue);
    assert.equal(view.readyForE316, true);
  });
});
