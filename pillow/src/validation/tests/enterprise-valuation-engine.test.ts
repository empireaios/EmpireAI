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
import {
  assembleEnterpriseValuationEngine,
  buildFallbackEnterpriseValuationEngine,
  ENTERPRISE_VALUATION_PIPELINE,
  ENTERPRISE_VALUATION_PRINCIPLES,
  GOVERNED_VALUATION_DOMAINS,
} from "../../enterprise-valuation-engine/index.js";

describe("E3-14 Enterprise Valuation Engine", () => {
  test("buildFallbackEnterpriseValuationEngine returns constitutional valuation model", () => {
    const view = buildFallbackEnterpriseValuationEngine();
    assert.equal(view.engineVersion, "E3-14");
    assert.equal(view.valuationPipeline.length, ENTERPRISE_VALUATION_PIPELINE.length);
    assert.deepEqual(view.valuationPrinciples, [...ENTERPRISE_VALUATION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_VALUATION_DOMAINS.length);
    assert.ok(view.enterpriseValuations.length >= 10);
    assert.ok(view.valuationDrivers.length >= 1);
    assert.ok(view.revenueContribution.length >= 1);
    assert.ok(view.profitContribution.length >= 1);
    assert.ok(view.riskAdjustments.length >= 1);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.estimatedEnterpriseValue, "$18.4M");
    assert.equal(view.readyForE315, true);
  });

  test("assembleEnterpriseValuationEngine consolidates E3-01 through E3-13", () => {
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
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-14" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });
    const view = assembleEnterpriseValuationEngine({
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
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E3-14" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E3-14");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.executivePerformanceDashboard.includes("E3-13"));
    assert.ok(view.integrations.executiveForecastIntelligence.includes("E3-12"));
    assert.ok(view.integrations.capitalRiskEngine.includes("E3-11"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.enterpriseValuations.every((v) => v.valuationId && v.estimatedEnterpriseValue));
    assert.equal(view.readyForE315, true);
  });
});
