/** R3-18 — End-to-end financial workflow test runner. */

import { appendCertificationLog } from "./foc-logging.js";
import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";
import type { FinancialOperationsCertificationContext } from "./financial-operations-certification-context.js";

export type EndToEndValidationResult = {
  result: "pass" | "partial" | "fail";
  evidenceReferences: string[];
  errors: string[];
  warnings: string[];
};

export class EndToEndFinancialTestRunner {
  async run(
    ctx: FinancialOperationsCertificationContext,
    config: FinancialOperationsCertificationConfiguration,
  ): Promise<EndToEndValidationResult> {
    const evidenceReferences: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.safeTestMode) {
      warnings.push("End-to-end validation skipped — safe test mode disabled");
      return { result: "partial", evidenceReferences, errors, warnings };
    }

    appendCertificationLog({
      event: "e2e_validation_start",
      level: "info",
      details: "End-to-end financial workflow validation started",
    });

    try {
      if (!ctx.paymentGateway || !ctx.bankingIntegration) {
        errors.push("Payment or banking integration unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        ctx.paymentGateway.connectPaymentGateway();
        ctx.bankingIntegration.connectBankingIntegration();
        ctx.bankingIntegration.syncBankAccounts({ includeFixtureAccounts: true });
        evidenceReferences.push("payment-gateway:connect");
        evidenceReferences.push("banking-integration:sync-accounts");
      }

      if (!ctx.revenueEngine || !ctx.expenseEngine) {
        errors.push("Revenue or expense engine unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        ctx.revenueEngine.connectRevenueEngine();
        ctx.expenseEngine.connectExpenseEngine();
        evidenceReferences.push("revenue-engine:connect");
        evidenceReferences.push("expense-engine:connect");
      }

      if (!ctx.profitCalculationEngine) {
        warnings.push("Profit calculation engine unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.profitCalculationEngine.connectProfitCalculationEngine();
        ctx.profitCalculationEngine.calculateProfit();
        evidenceReferences.push("profit-calculation-engine:calculate-profit");
      }

      if (!ctx.cashFlowMonitor) {
        warnings.push("Cash flow monitor unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.cashFlowMonitor.connectCashFlowMonitor();
        ctx.cashFlowMonitor.monitorCashFlow();
        evidenceReferences.push("cash-flow-monitor:monitor");
      }

      if (!ctx.reconciliationEngine) {
        warnings.push("Reconciliation engine unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.reconciliationEngine.connectReconciliationEngine();
        ctx.reconciliationEngine.reconcileAll();
        evidenceReferences.push("reconciliation-engine:reconcile-all");
      }

      if (!ctx.invoiceGenerator || !ctx.taxIntelligenceEngine) {
        warnings.push("Invoice or tax engine unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.invoiceGenerator.connectInvoiceGenerator();
        ctx.taxIntelligenceEngine.connectTaxIntelligenceEngine();
        ctx.taxIntelligenceEngine.generateTaxSummary();
        evidenceReferences.push("tax-intelligence-engine:generate-summary");
      }

      if (!ctx.executiveFinancialDashboard) {
        warnings.push("Executive financial dashboard unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.executiveFinancialDashboard.connectExecutiveFinancialDashboard();
        ctx.executiveFinancialDashboard.refreshExecutiveDashboard({ forceRefresh: true });
        evidenceReferences.push("executive-financial-dashboard:refresh");
      }

      if (!ctx.accountingExportEngine) {
        warnings.push("Accounting export engine unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.accountingExportEngine.connectAccountingExportEngine();
        const exportReport = ctx.accountingExportEngine.exportFinancialRecords({
          forceExport: true,
        });
        if (exportReport.exportRecords[0]) {
          evidenceReferences.push(
            `accounting-export-engine:${exportReport.exportRecords[0].exportRecordId}`,
          );
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "E2E workflow failed");
    }

    const result = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    appendCertificationLog({
      event: "e2e_validation_complete",
      level: result === "fail" ? "warn" : "info",
      details: `E2E result=${result} evidence=${evidenceReferences.length}`,
    });

    return { result, evidenceReferences, errors, warnings };
  }
}
