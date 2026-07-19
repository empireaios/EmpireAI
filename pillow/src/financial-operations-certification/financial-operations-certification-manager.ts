/** R3-18 — Financial Operations Certification Manager. */

import { appendCertificationLog } from "./foc-logging.js";
import { CERTIFIED_MISSIONS } from "./paths.js";
import {
  BankingValidator,
  CashFlowValidator,
  ExpenseValidator,
  FinancialDashboardValidator,
  FinancialFrameworkValidator,
  InvoiceValidator,
  PaymentGatewayValidator,
  ProfitValidator,
  ReconciliationValidator,
  RefundValidator,
  RevenueValidator,
  TaxValidator,
} from "./financial-validators.js";
import { EndToEndFinancialTestRunner } from "./end-to-end-financial-test-runner.js";
import { CertificationValidator } from "./certification-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";
import type { FinancialOperationsCertificationContext } from "./financial-operations-certification-context.js";
import type {
  MissionValidationResult,
  RunFinancialOperationsCertificationInput,
  FinancialOperationsCertificationReport,
} from "./types.js";

export class FinancialOperationsCertificationManager {
  private running = false;
  private readonly financialFrameworkValidator = new FinancialFrameworkValidator();
  private readonly paymentGatewayValidator = new PaymentGatewayValidator();
  private readonly bankingValidator = new BankingValidator();
  private readonly revenueValidator = new RevenueValidator();
  private readonly expenseValidator = new ExpenseValidator();
  private readonly profitValidator = new ProfitValidator();
  private readonly cashFlowValidator = new CashFlowValidator();
  private readonly reconciliationValidator = new ReconciliationValidator();
  private readonly invoiceValidator = new InvoiceValidator();
  private readonly refundValidator = new RefundValidator();
  private readonly taxValidator = new TaxValidator();
  private readonly financialDashboardValidator = new FinancialDashboardValidator();
  private readonly endToEndRunner = new EndToEndFinancialTestRunner();
  private readonly certificationValidator = new CertificationValidator();
  private readonly reportGenerator = new CertificationReportGenerator();

  isRunning(): boolean {
    return this.running;
  }

  getCertifiedMissionCatalog() {
    return [...CERTIFIED_MISSIONS];
  }

  async runCertification(
    ctx: FinancialOperationsCertificationContext,
    config: FinancialOperationsCertificationConfiguration,
    input: RunFinancialOperationsCertificationInput = {},
  ): Promise<FinancialOperationsCertificationReport> {
    if (this.running) throw new Error("Financial certification already running");
    this.running = true;
    const started = Date.now();

    const effectiveConfig: FinancialOperationsCertificationConfiguration = {
      ...config,
      includeSmokeTests: input.includeSmokeTests ?? config.includeSmokeTests,
    };

    try {
      const missionResults: MissionValidationResult[] = [];
      const scope = config.certificationScope;
      const missionScope = input.missionScope;

      const shouldRun = (missionId: string): boolean => {
        if (missionScope && missionScope.length > 0) {
          return missionScope.includes(missionId);
        }
        if (scope === "full") return true;
        if (scope === "framework") return missionId === "R3-01";
        if (scope === "payments") return ["R3-02", "R3-03"].includes(missionId);
        if (scope === "core") return ["R3-04", "R3-05", "R3-06", "R3-07"].includes(missionId);
        if (scope === "reconciliation") return missionId === "R3-08";
        if (scope === "invoicing") return ["R3-09", "R3-10"].includes(missionId);
        if (scope === "tax") return missionId === "R3-11";
        if (scope === "reporting") {
          return ["R3-12", "R3-13", "R3-14", "R3-15", "R3-16", "R3-17"].includes(missionId);
        }
        return true;
      };

      appendCertificationLog({
        event: "validation_execution",
        level: "info",
        details: `Financial certification scope=${scope}`,
      });

      if (shouldRun("R3-01")) {
        missionResults.push(
          await this.financialFrameworkValidator.validate(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R3-02")) {
        missionResults.push(
          await this.paymentGatewayValidator.validate(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R3-03")) {
        missionResults.push(await this.bankingValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-04")) {
        missionResults.push(await this.revenueValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-05")) {
        missionResults.push(await this.expenseValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-06")) {
        missionResults.push(await this.profitValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-07")) {
        missionResults.push(await this.cashFlowValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-08")) {
        missionResults.push(
          await this.reconciliationValidator.validate(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R3-09")) {
        missionResults.push(await this.invoiceValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-10")) {
        missionResults.push(await this.refundValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R3-11")) {
        missionResults.push(await this.taxValidator.validate(ctx, effectiveConfig));
      }

      const extendedResults = await this.financialDashboardValidator.validateExtendedModules(
        ctx,
        effectiveConfig,
      );
      for (const result of extendedResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      if (shouldRun("R3-16")) {
        missionResults.push(
          await this.financialDashboardValidator.validate(ctx, effectiveConfig),
        );
      }

      const certifiedMissionList =
        missionScope && missionScope.length > 0
          ? missionScope
          : missionResults.map((r) => r.missionId);

      const runE2E = scope === "full" && (!missionScope || missionScope.length === 0);
      const e2e = runE2E
        ? await this.endToEndRunner.run(ctx, effectiveConfig)
        : {
            result: "partial" as const,
            evidenceReferences: [] as string[],
            errors: [] as string[],
            warnings: ["End-to-end validation skipped for scoped certification"],
          };

      const validation = this.certificationValidator.validateCertificationResult({
        missionResults,
        config: effectiveConfig,
      });

      const report = this.reportGenerator.generate({
        missionResults,
        certifiedMissionList,
        endToEndValidationResult: e2e.result,
        evidenceReferences: e2e.evidenceReferences,
        validation,
        recoveryStatus: "idle",
        config: effectiveConfig,
        durationMs: Date.now() - started,
      });

      if (e2e.errors.length > 0) {
        report.detectedFailures.push(...e2e.errors.map((e) => `E2E: ${e}`));
      }
      if (e2e.warnings.length > 0) {
        report.detectedWarnings.push(...e2e.warnings.map((w) => `E2E: ${w}`));
      }
      if (e2e.result === "fail" && report.overallCertificationStatus !== "failed") {
        report.overallCertificationStatus = "partial";
      }

      const integrity = this.certificationValidator.validateReportIntegrity(report);
      if (integrity.decision === "fail") {
        report.detectedFailures.push(...integrity.errors);
        report.overallCertificationStatus = "failed";
      }

      appendCertificationLog({
        event: "certification_complete",
        level: report.overallCertificationStatus === "failed" ? "warn" : "info",
        details: `Certified ${missionResults.filter((r) => r.status === "pass").length}/${missionResults.length} missions · E2E=${e2e.result}`,
      });

      return report;
    } finally {
      this.running = false;
    }
  }

  resetForTesting(): void {
    this.running = false;
  }
}
