/** R3-18 — Core financial module validators (R3-01 through R3-11). */

import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";
import type { FinancialOperationsCertificationContext } from "./financial-operations-certification-context.js";
import type { MissionValidationResult } from "./types.js";
import { validateEngineMission } from "./mission-validator-utils.js";

type ValidatorConfig = FinancialOperationsCertificationConfiguration;
type ValidatorContext = FinancialOperationsCertificationContext;

export class FinancialFrameworkValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-01",
      missionLabel: "Financial Framework",
      engine: ctx.financialFramework,
      expectedMissionId: "R3-01",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.financialFramework?.runDiagnostics();
            }
          : undefined,
    });
  }
}

export class PaymentGatewayValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-02",
      missionLabel: "Payment Gateway Integration",
      engine: ctx.paymentGateway,
      expectedMissionId: "R3-02",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.paymentGateway?.getState();
            }
          : undefined,
    });
  }
}

export class BankingValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-03",
      missionLabel: "Banking Integration",
      engine: ctx.bankingIntegration,
      expectedMissionId: "R3-03",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.bankingIntegration?.getState();
            }
          : undefined,
    });
  }
}

export class RevenueValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-04",
      missionLabel: "Revenue Engine",
      engine: ctx.revenueEngine,
      expectedMissionId: "R3-04",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.revenueEngine?.getRevenueRecords();
            }
          : undefined,
    });
  }
}

export class ExpenseValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-05",
      missionLabel: "Expense Engine",
      engine: ctx.expenseEngine,
      expectedMissionId: "R3-05",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.expenseEngine?.getExpenseRecords();
            }
          : undefined,
    });
  }
}

export class ProfitValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-06",
      missionLabel: "Profit Calculation Engine",
      engine: ctx.profitCalculationEngine,
      expectedMissionId: "R3-06",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.profitCalculationEngine?.getProfitRecords();
            }
          : undefined,
    });
  }
}

export class CashFlowValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-07",
      missionLabel: "Cash Flow Monitor",
      engine: ctx.cashFlowMonitor,
      expectedMissionId: "R3-07",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.cashFlowMonitor?.getCashFlowRecords();
            }
          : undefined,
    });
  }
}

export class ReconciliationValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-08",
      missionLabel: "Reconciliation Engine",
      engine: ctx.reconciliationEngine,
      expectedMissionId: "R3-08",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.reconciliationEngine?.getReconciliationRecords();
            }
          : undefined,
    });
  }
}

export class InvoiceValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-09",
      missionLabel: "Invoice Generator",
      engine: ctx.invoiceGenerator,
      expectedMissionId: "R3-09",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.invoiceGenerator?.getInvoiceRecords();
            }
          : undefined,
    });
  }
}

export class RefundValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-10",
      missionLabel: "Refund Engine",
      engine: ctx.refundEngine,
      expectedMissionId: "R3-10",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.refundEngine?.getRefundRecords();
            }
          : undefined,
    });
  }
}

export class TaxValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-11",
      missionLabel: "Tax Intelligence Engine",
      engine: ctx.taxIntelligenceEngine,
      expectedMissionId: "R3-11",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.taxIntelligenceEngine?.getTaxRecords();
            }
          : undefined,
    });
  }
}

export class FinancialDashboardValidator {
  async validate(ctx: ValidatorContext, config: ValidatorConfig): Promise<MissionValidationResult> {
    return validateEngineMission({
      missionId: "R3-16",
      missionLabel: "Executive Financial Dashboard",
      engine: ctx.executiveFinancialDashboard,
      expectedMissionId: "R3-16",
      smokeTest:
        config.includeSmokeTests && config.safeTestMode
          ? () => {
              ctx.executiveFinancialDashboard?.getCockpitSnapshot();
            }
          : undefined,
    });
  }

  async validateExtendedModules(
    ctx: ValidatorContext,
    config: ValidatorConfig,
  ): Promise<MissionValidationResult[]> {
    const modules: Array<{
      missionId: string;
      label: string;
      engine: { getState: () => { missionId: string; engineVersion: string; status: string } } | null;
    }> = [
      { missionId: "R3-12", label: "Multi-Currency Engine", engine: ctx.multiCurrencyEngine },
      { missionId: "R3-13", label: "Financial Forecast Engine", engine: ctx.financialForecastEngine },
      { missionId: "R3-14", label: "Budget Management Engine", engine: ctx.budgetManagementEngine },
      { missionId: "R3-15", label: "Financial Risk Monitor", engine: ctx.financialRiskMonitor },
      { missionId: "R3-17", label: "Accounting Export Engine", engine: ctx.accountingExportEngine },
    ];

    const results: MissionValidationResult[] = [];
    for (const mod of modules) {
      results.push(
        await validateEngineMission({
          missionId: mod.missionId,
          missionLabel: mod.label,
          engine: mod.engine,
          expectedMissionId: mod.missionId,
          smokeTest:
            config.includeSmokeTests && config.safeTestMode
              ? () => {
                  mod.engine?.getState();
                }
              : undefined,
        }),
      );
    }
    return results;
  }
}
