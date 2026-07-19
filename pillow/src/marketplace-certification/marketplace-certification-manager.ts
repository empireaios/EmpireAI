/** R1-15 — Marketplace Certification Manager. */

import { appendCertificationLog } from "./mct-logging.js";
import { CERTIFIED_MISSIONS } from "./paths.js";
import { ConnectorFrameworkValidator } from "./connector-framework-validator.js";
import { AmazonValidator } from "./amazon-validator.js";
import { MarketplaceConnectorValidator } from "./marketplace-connector-validator.js";
import { ProductNormalizationValidator } from "./product-normalization-validator.js";
import { OrderNormalizationValidator } from "./order-normalization-validator.js";
import { HealthMonitorValidator } from "./health-monitor-validator.js";
import { CertificationValidator } from "./certification-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type { MarketplaceCertificationContext } from "./marketplace-certification-context.js";
import type {
  MarketplaceCertificationReport,
  MissionValidationResult,
  RunCertificationInput,
} from "./types.js";

export class MarketplaceCertificationManager {
  private running = false;
  private readonly connectorFrameworkValidator = new ConnectorFrameworkValidator();
  private readonly amazonValidator = new AmazonValidator();
  private readonly marketplaceConnectorValidator = new MarketplaceConnectorValidator();
  private readonly productNormalizationValidator = new ProductNormalizationValidator();
  private readonly orderNormalizationValidator = new OrderNormalizationValidator();
  private readonly healthMonitorValidator = new HealthMonitorValidator();
  private readonly certificationValidator = new CertificationValidator();
  private readonly reportGenerator = new CertificationReportGenerator();

  isRunning(): boolean {
    return this.running;
  }

  async runCertification(
    ctx: MarketplaceCertificationContext,
    config: MarketplaceCertificationConfiguration,
    input: RunCertificationInput = {},
  ): Promise<MarketplaceCertificationReport> {
    if (this.running) throw new Error("Certification already running");
    this.running = true;
    const started = Date.now();

    const effectiveConfig: MarketplaceCertificationConfiguration = {
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
        if (scope === "connectors") {
          return [
            "R1-01",
            "R1-02",
            "R1-03",
            "R1-04",
            "R1-05",
            "R1-06",
            "R1-07",
            "R1-08",
            "R1-09",
            "R1-10",
            "R1-11",
          ].includes(missionId);
        }
        if (scope === "normalization") return ["R1-12", "R1-13"].includes(missionId);
        if (scope === "health") return missionId === "R1-14";
        return true;
      };

      if (shouldRun("R1-01")) {
        missionResults.push(
          await this.connectorFrameworkValidator.validate(ctx, effectiveConfig),
        );
      }

      const amazonResults = await this.amazonValidator.validateAll(ctx, effectiveConfig);
      for (const result of amazonResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      const connectorResults = await this.marketplaceConnectorValidator.validateAll(
        ctx,
        effectiveConfig,
      );
      for (const result of connectorResults) {
        if (shouldRun(result.missionId)) missionResults.push(result);
      }

      if (shouldRun("R1-12")) {
        missionResults.push(
          await this.productNormalizationValidator.validate(ctx, effectiveConfig),
        );
      }

      if (shouldRun("R1-13")) {
        missionResults.push(
          await this.orderNormalizationValidator.validate(ctx, effectiveConfig),
        );
      }

      if (shouldRun("R1-14")) {
        missionResults.push(
          await this.healthMonitorValidator.validate(ctx, effectiveConfig),
        );
      }

      const certifiedMissionList =
        missionScope && missionScope.length > 0
          ? missionScope
          : missionResults.map((r) => r.missionId);

      const validation = this.certificationValidator.validateCertificationResult({
        missionResults,
        config: effectiveConfig,
      });

      const report = this.reportGenerator.generate({
        missionResults,
        certifiedMissionList,
        validation,
        recoveryStatus: "idle",
        config: effectiveConfig,
        durationMs: Date.now() - started,
      });

      const integrity = this.certificationValidator.validateReportIntegrity(report);
      if (integrity.decision === "fail") {
        report.detectedFailures.push(...integrity.errors);
        report.overallCertificationStatus = "failed";
      }

      appendCertificationLog({
        event: "certification_complete",
        level: report.overallCertificationStatus === "failed" ? "warn" : "info",
        details: `Certified ${missionResults.filter((r) => r.status === "pass").length}/${missionResults.length} missions`,
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
