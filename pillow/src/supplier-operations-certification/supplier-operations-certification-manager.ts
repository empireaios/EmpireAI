/** R2-20 — Supplier Operations Certification Manager. */

import { appendCertificationLog } from "./soc-logging.js";
import { CERTIFIED_MISSIONS } from "./paths.js";
import { SupplierFrameworkValidator } from "./supplier-framework-validator.js";
import { SupplierConnectorValidator } from "./supplier-connector-validator.js";
import { ProductSynchronizationValidator } from "./product-synchronization-validator.js";
import { InventorySynchronizationValidator } from "./inventory-synchronization-validator.js";
import { ProcurementValidator } from "./procurement-validator.js";
import { FulfilmentValidator } from "./fulfilment-validator.js";
import { WarehouseValidator } from "./warehouse-validator.js";
import { RiskValidator } from "./risk-validator.js";
import { LogisticsValidator } from "./logistics-validator.js";
import { EndToEndSupplierTestRunner } from "./end-to-end-supplier-test-runner.js";
import { CertificationValidator } from "./certification-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type {
  MissionValidationResult,
  RunSupplierCertificationInput,
  SupplierOperationsCertificationReport,
} from "./types.js";

export class SupplierOperationsCertificationManager {
  private running = false;
  private readonly supplierFrameworkValidator = new SupplierFrameworkValidator();
  private readonly supplierConnectorValidator = new SupplierConnectorValidator();
  private readonly productSynchronizationValidator = new ProductSynchronizationValidator();
  private readonly inventorySynchronizationValidator = new InventorySynchronizationValidator();
  private readonly procurementValidator = new ProcurementValidator();
  private readonly fulfilmentValidator = new FulfilmentValidator();
  private readonly warehouseValidator = new WarehouseValidator();
  private readonly riskValidator = new RiskValidator();
  private readonly logisticsValidator = new LogisticsValidator();
  private readonly endToEndRunner = new EndToEndSupplierTestRunner();
  private readonly certificationValidator = new CertificationValidator();
  private readonly reportGenerator = new CertificationReportGenerator();

  isRunning(): boolean {
    return this.running;
  }

  async runCertification(
    ctx: SupplierOperationsCertificationContext,
    config: SupplierOperationsCertificationConfiguration,
    input: RunSupplierCertificationInput = {},
  ): Promise<SupplierOperationsCertificationReport> {
    if (this.running) throw new Error("Supplier certification already running");
    this.running = true;
    const started = Date.now();

    const effectiveConfig: SupplierOperationsCertificationConfiguration = {
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
        if (scope === "framework") return missionId === "R2-01";
        if (scope === "connectors") return ["R2-02", "R2-03", "R2-04"].includes(missionId);
        if (scope === "sync") return ["R2-05", "R2-06"].includes(missionId);
        if (scope === "procurement") {
          return ["R2-07", "R2-08", "R2-09", "R2-19"].includes(missionId);
        }
        if (scope === "fulfilment") {
          return ["R2-10", "R2-11", "R2-12", "R2-13"].includes(missionId);
        }
        if (scope === "warehouse") return ["R2-14", "R2-15"].includes(missionId);
        if (scope === "logistics") return ["R2-17", "R2-18"].includes(missionId);
        if (scope === "risk") return missionId === "R2-16";
        return true;
      };

      if (shouldRun("R2-01")) {
        missionResults.push(
          await this.supplierFrameworkValidator.validate(ctx, effectiveConfig),
        );
      }

      const connectorResults = await this.supplierConnectorValidator.validateAll(
        ctx,
        effectiveConfig,
      );
      for (const result of connectorResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      if (shouldRun("R2-05")) {
        missionResults.push(
          await this.productSynchronizationValidator.validate(ctx, effectiveConfig),
        );
      }

      if (shouldRun("R2-06")) {
        missionResults.push(
          await this.inventorySynchronizationValidator.validate(ctx, effectiveConfig),
        );
      }

      const procurementResults = await this.procurementValidator.validateAll(
        ctx,
        effectiveConfig,
      );
      for (const result of procurementResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      const fulfilmentResults = await this.fulfilmentValidator.validateAll(
        ctx,
        effectiveConfig,
      );
      for (const result of fulfilmentResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      const warehouseResults = await this.warehouseValidator.validateAll(
        ctx,
        effectiveConfig,
      );
      for (const result of warehouseResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      if (shouldRun("R2-16")) {
        missionResults.push(await this.riskValidator.validate(ctx, effectiveConfig));
      }

      const logisticsResults = await this.logisticsValidator.validateAll(
        ctx,
        effectiveConfig,
      );
      for (const result of logisticsResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      const certifiedMissionList =
        missionScope && missionScope.length > 0
          ? missionScope
          : missionResults.map((r) => r.missionId);

      const runE2E =
        scope === "full" && (!missionScope || missionScope.length === 0);
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

  getCertifiedMissionCatalog() {
    return [...CERTIFIED_MISSIONS];
  }

  resetForTesting(): void {
    this.running = false;
  }
}
