/** R3-16 — Dashboard data source (read-only consumption of R3-04 through R3-15). */

import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import type { FinancialRiskMonitor } from "../financial-risk-monitor/engine.js";

export type DashboardFinancialData = {
  totalRevenue: number;
  revenueCount: number;
  totalExpenses: number;
  expenseCount: number;
  netProfit: number;
  profitMarginPercent: number;
  netCashFlow: number;
  liquidity: number;
  budgetAllocation: number;
  budgetUtilization: number;
  budgetCount: number;
  revenueForecast: number;
  expenseForecast: number;
  forecastConfidence: number;
  riskScore: number;
  activeAlerts: number;
  riskStatus: string;
  warnings: string[];
};

export class DashboardDataSource {
  constructor(
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly financialForecastEngine: FinancialForecastEngine | null,
    private readonly budgetManagementEngine: BudgetManagementEngine | null,
    private readonly financialRiskMonitor: FinancialRiskMonitor | null,
  ) {}

  aggregate(): DashboardFinancialData {
    const warnings: string[] = [];
    let totalRevenue = 0;
    let revenueCount = 0;
    let totalExpenses = 0;
    let expenseCount = 0;
    let netProfit = 0;
    let netCashFlow = 0;
    let liquidity = 0;

    if (this.revenueEngine) {
      const records = this.revenueEngine
        .getRevenueRecords()
        .filter((r) => r.validationStatus === "passed");
      revenueCount = records.length;
      totalRevenue = records.reduce((s, r) => s + (r.netRevenue ?? r.grossRevenue ?? 0), 0);
    } else {
      warnings.push("Revenue Engine unavailable");
    }

    if (this.expenseEngine) {
      const records = this.expenseEngine
        .getExpenseRecords()
        .filter((r) => r.validationStatus === "passed");
      expenseCount = records.length;
      totalExpenses = records.reduce((s, e) => s + (e.expenseAmount ?? 0), 0);
    } else {
      warnings.push("Expense Engine unavailable");
    }

    if (this.profitCalculationEngine) {
      const profits = this.profitCalculationEngine
        .getProfitRecords()
        .filter((r) => r.validationStatus === "passed");
      const latest = profits[profits.length - 1];
      netProfit = latest?.netProfit ?? totalRevenue - totalExpenses;
    } else {
      netProfit = totalRevenue - totalExpenses;
      warnings.push("Profit Calculation Engine unavailable");
    }

    if (this.cashFlowMonitor) {
      const flows = this.cashFlowMonitor
        .getCashFlowRecords()
        .filter((r) => r.validationStatus === "passed");
      const latest = flows[flows.length - 1];
      netCashFlow = latest?.netCashFlow ?? 0;
      liquidity = latest?.closingBalance ?? netCashFlow;
    } else {
      warnings.push("Cash Flow Monitor unavailable");
    }

    const profitMarginPercent =
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;

    let budgetAllocation = 0;
    let budgetUtilization = 0;
    let budgetCount = 0;
    if (this.budgetManagementEngine) {
      const budgets = this.budgetManagementEngine.getBudgetRecords();
      budgetCount = budgets.length;
      budgetAllocation = budgets.reduce((s, b) => s + b.budgetAllocation, 0);
      budgetUtilization =
        budgets.length > 0
          ? budgets.reduce((s, b) => s + b.budgetUtilizationPercentage, 0) / budgets.length
          : 0;
    } else {
      warnings.push("Budget Management Engine unavailable");
    }

    let revenueForecast = 0;
    let expenseForecast = 0;
    let forecastConfidence = 0;
    if (this.financialForecastEngine) {
      const forecasts = this.financialForecastEngine.getForecastRecords();
      const latest = forecasts[forecasts.length - 1];
      revenueForecast = latest?.revenueForecast ?? 0;
      expenseForecast = latest?.expenseForecast ?? 0;
      forecastConfidence = latest?.forecastConfidenceScore ?? 0;
    } else {
      warnings.push("Financial Forecast Engine unavailable");
    }

    let riskScore = 0;
    let activeAlerts = 0;
    let riskStatus = "unknown";
    if (this.financialRiskMonitor) {
      const risks = this.financialRiskMonitor.getRiskRecords();
      const latest = risks[risks.length - 1];
      riskScore = latest?.riskScore ?? 0;
      activeAlerts = latest?.activeAlerts ?? 0;
      riskStatus = latest?.liquidityStatus ?? "unknown";
    } else {
      warnings.push("Financial Risk Monitor unavailable");
    }

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueCount,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenseCount,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMarginPercent,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      liquidity: Math.round(liquidity * 100) / 100,
      budgetAllocation: Math.round(budgetAllocation * 100) / 100,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      budgetCount,
      revenueForecast,
      expenseForecast,
      forecastConfidence,
      riskScore,
      activeAlerts,
      riskStatus,
      warnings,
    };
  }
}
