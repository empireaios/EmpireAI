/** R3-18 — Financial operations certification context (R3-01 through R3-17). */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import type { MultiCurrencyEngine } from "../multi-currency-engine/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import type { FinancialRiskMonitor } from "../financial-risk-monitor/engine.js";
import type { ExecutiveFinancialDashboard } from "../executive-financial-dashboard/engine.js";
import type { AccountingExportEngine } from "../accounting-export-engine/engine.js";

export type FinancialOperationsCertificationContext = {
  financialFramework: FinancialFrameworkEngine | null;
  paymentGateway: PaymentGatewayIntegrationEngine | null;
  bankingIntegration: BankingIntegrationEngine | null;
  revenueEngine: RevenueEngine | null;
  expenseEngine: ExpenseEngine | null;
  profitCalculationEngine: ProfitCalculationEngine | null;
  cashFlowMonitor: CashFlowMonitorEngine | null;
  reconciliationEngine: ReconciliationEngine | null;
  invoiceGenerator: InvoiceGeneratorEngine | null;
  refundEngine: RefundEngine | null;
  taxIntelligenceEngine: TaxIntelligenceEngine | null;
  multiCurrencyEngine: MultiCurrencyEngine | null;
  financialForecastEngine: FinancialForecastEngine | null;
  budgetManagementEngine: BudgetManagementEngine | null;
  financialRiskMonitor: FinancialRiskMonitor | null;
  executiveFinancialDashboard: ExecutiveFinancialDashboard | null;
  accountingExportEngine: AccountingExportEngine | null;
};

export const EMPTY_FINANCIAL_CERTIFICATION_CONTEXT: FinancialOperationsCertificationContext = {
  financialFramework: null,
  paymentGateway: null,
  bankingIntegration: null,
  revenueEngine: null,
  expenseEngine: null,
  profitCalculationEngine: null,
  cashFlowMonitor: null,
  reconciliationEngine: null,
  invoiceGenerator: null,
  refundEngine: null,
  taxIntelligenceEngine: null,
  multiCurrencyEngine: null,
  financialForecastEngine: null,
  budgetManagementEngine: null,
  financialRiskMonitor: null,
  executiveFinancialDashboard: null,
  accountingExportEngine: null,
};
