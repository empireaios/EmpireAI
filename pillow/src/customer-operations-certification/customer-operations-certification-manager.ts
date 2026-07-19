/** R4-19 — Customer Operations Certification Manager. */

import { appendCocLog } from "./coc-logging.js";
import { CERTIFIED_MISSIONS } from "./paths.js";
import {
  CommunicationValidator,
  CrmValidator,
  CustomerAnalyticsValidator,
  CustomerIdentityValidator,
  CustomerIntelligenceValidator,
  CustomerTimelineValidator,
} from "./customer-validators.js";
import { EndToEndCustomerTestRunner } from "./end-to-end-customer-test-runner.js";
import { CertificationValidator } from "./certification-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";
import type { CustomerOperationsCertificationContext } from "./customer-operations-certification-context.js";
import type {
  MissionValidationResult,
  RunCustomerOperationsCertificationInput,
  CustomerOperationsCertificationReport,
} from "./types.js";

export class CustomerOperationsCertificationManager {
  private running = false;
  private readonly customerIdentityValidator = new CustomerIdentityValidator();
  private readonly crmValidator = new CrmValidator();
  private readonly customerTimelineValidator = new CustomerTimelineValidator();
  private readonly communicationValidator = new CommunicationValidator();
  private readonly customerAnalyticsValidator = new CustomerAnalyticsValidator();
  private readonly customerIntelligenceValidator = new CustomerIntelligenceValidator();
  private readonly endToEndRunner = new EndToEndCustomerTestRunner();
  private readonly certificationValidator = new CertificationValidator();
  private readonly reportGenerator = new CertificationReportGenerator();

  isRunning(): boolean {
    return this.running;
  }

  getCertifiedMissionCatalog() {
    return [...CERTIFIED_MISSIONS];
  }

  async runCertification(
    ctx: CustomerOperationsCertificationContext,
    config: CustomerOperationsCertificationConfiguration,
    input: RunCustomerOperationsCertificationInput = {},
  ): Promise<CustomerOperationsCertificationReport> {
    if (this.running) throw new Error("Customer certification already running");
    this.running = true;
    const started = Date.now();

    const effectiveConfig: CustomerOperationsCertificationConfiguration = {
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
        if (scope === "identity") return missionId === "R4-01";
        if (scope === "crm") return missionId === "R4-02";
        if (scope === "timeline") return missionId === "R4-03";
        if (scope === "communication") {
          return ["R4-04", "R4-05", "R4-06", "R4-07"].includes(missionId);
        }
        if (scope === "support") return ["R4-08", "R4-09"].includes(missionId);
        if (scope === "analytics") {
          return ["R4-10", "R4-11", "R4-12", "R4-13", "R4-14", "R4-15"].includes(missionId);
        }
        if (scope === "intelligence") {
          return ["R4-16", "R4-17", "R4-18"].includes(missionId);
        }
        return true;
      };

      appendCocLog({
        event: "validation_execution",
        level: "info",
        details: `Customer certification scope=${scope}`,
      });

      if (shouldRun("R4-01")) {
        missionResults.push(
          await this.customerIdentityValidator.validate(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-02")) {
        missionResults.push(await this.crmValidator.validate(ctx, effectiveConfig));
      }
      if (shouldRun("R4-03")) {
        missionResults.push(
          await this.customerTimelineValidator.validate(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-04")) {
        missionResults.push(
          await this.communicationValidator.validateEmail(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-05")) {
        missionResults.push(
          await this.communicationValidator.validateSms(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-06")) {
        missionResults.push(
          await this.communicationValidator.validateWhatsApp(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-07")) {
        missionResults.push(
          await this.communicationValidator.validateLiveChat(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-08")) {
        missionResults.push(
          await this.communicationValidator.validateAiSupport(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-09")) {
        missionResults.push(
          await this.communicationValidator.validateTicketManagement(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-10")) {
        missionResults.push(
          await this.customerAnalyticsValidator.validateSentiment(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-11")) {
        missionResults.push(
          await this.customerAnalyticsValidator.validateReviewManagement(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-12")) {
        missionResults.push(
          await this.customerAnalyticsValidator.validateLoyalty(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-13")) {
        missionResults.push(
          await this.customerAnalyticsValidator.validateReturns(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-14")) {
        missionResults.push(
          await this.customerAnalyticsValidator.validateRisk(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-15")) {
        missionResults.push(
          await this.customerAnalyticsValidator.validateClv(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-16")) {
        missionResults.push(
          await this.customerIntelligenceValidator.validateSegmentation(ctx, effectiveConfig),
        );
      }
      if (shouldRun("R4-17")) {
        missionResults.push(
          await this.customerIntelligenceValidator.validateJourneyIntelligence(
            ctx,
            effectiveConfig,
          ),
        );
      }
      if (shouldRun("R4-18")) {
        missionResults.push(
          await this.customerIntelligenceValidator.validateExecutiveDashboard(
            ctx,
            effectiveConfig,
          ),
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

      appendCocLog({
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
