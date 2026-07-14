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
import {
  assembleExecutivePerformanceDashboard,
  buildFallbackExecutivePerformanceDashboard,
  EXECUTIVE_PERFORMANCE_WIDGETS,
  EXECUTIVE_PERFORMANCE_PRINCIPLES,
  EXECUTIVE_NAVIGATION_TARGETS,
} from "../../executive-performance-dashboard/index.js";

describe("E3-13 Executive Performance Dashboard", () => {
  test("buildFallbackExecutivePerformanceDashboard returns unified financial command center", () => {
    const view = buildFallbackExecutivePerformanceDashboard();
    assert.equal(view.engineVersion, "E3-13");
    assert.equal(view.financialWidgets.length, EXECUTIVE_PERFORMANCE_WIDGETS.length);
    assert.deepEqual(view.dashboardPrinciples, [...EXECUTIVE_PERFORMANCE_PRINCIPLES]);
    assert.equal(view.executiveNavigation.length, EXECUTIVE_NAVIGATION_TARGETS.length);
    assert.ok(view.executiveSummary.healthScore >= 0);
    assert.ok(view.consolidatedRecommendations.length >= 1);
    assert.equal(view.realtimePollIntervalMs, 5000);
    assert.equal(view.readyForE314, true);
  });

  test("assembleExecutivePerformanceDashboard consolidates E3-01 through E3-12", () => {
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
    const view = assembleExecutivePerformanceDashboard({
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
      journey: { currentMission: "E3-13" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E3-13");
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.executiveForecastIntelligence.includes("E3-12"));
    assert.ok(view.integrations.capitalRiskEngine.includes("E3-11"));
    assert.ok(view.integrations.guardianStatus.includes("Guardian"));
    assert.ok(view.financialWidgets.every((w) => w.widgetId && w.href && w.engineId));
    assert.ok(view.executiveNavigation.every((n) => n.href && n.engineId));
    assert.equal(view.readyForE314, true);
  });
});
