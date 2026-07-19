/** R5-20 — Real World Operations Certification Manager. */

import { appendRwocLog } from "./rwoc-logging.js";
import { CERTIFIED_PROGRAMMES } from "./paths.js";
import { ProgrammeCertificationCoordinator } from "./programme-certification-coordinator.js";
import { EndToEndWorkflowValidator } from "./end-to-end-workflow-validator.js";
import { CrossProgrammeIntegrationValidator } from "./cross-programme-integration-validator.js";
import { OperationalReadinessEngine } from "./operational-readiness-engine.js";
import { CertificationValidator } from "./certification-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type { RealWorldOperationsCertificationContext } from "./real-world-operations-certification-context.js";
import type {
  ProgrammeValidationResult,
  RealWorldOperationsCertificationReport,
  RunRealWorldOperationsCertificationInput,
} from "./types.js";

export class RealWorldOperationsCertificationManager {
  private running = false;
  private readonly programmeCoordinator = new ProgrammeCertificationCoordinator();
  private readonly endToEndValidator = new EndToEndWorkflowValidator();
  private readonly crossProgrammeValidator = new CrossProgrammeIntegrationValidator();
  private readonly readinessEngine = new OperationalReadinessEngine();
  private readonly certificationValidator = new CertificationValidator();
  private readonly reportGenerator = new CertificationReportGenerator();

  isRunning(): boolean {
    return this.running;
  }

  getCertifiedProgrammeCatalog() {
    return [...CERTIFIED_PROGRAMMES];
  }

  async runCertification(
    ctx: RealWorldOperationsCertificationContext,
    config: RealWorldOperationsCertificationConfiguration,
    input: RunRealWorldOperationsCertificationInput = {},
  ): Promise<RealWorldOperationsCertificationReport> {
    if (this.running) throw new Error("Real World Operations Certification already running");
    this.running = true;
    const started = Date.now();

    try {
      appendRwocLog({
        event: "certification_start",
        level: "info",
        details: `RWOC started · scope=${config.certificationScope} · safeTestMode=${config.safeTestMode}`,
      });

      const inputValidation = this.certificationValidator.validateRunInput(input, config);
      if (inputValidation.decision === "fail") {
        return this.reportGenerator.generate({
          programmeResults: [],
          endToEndWorkflowResult: "fail",
          crossProgrammeIntegrationResult: "fail",
          operationalReadinessScore: 0,
          autonomousOperationalReadiness: false,
          validation: inputValidation,
          recoveryStatus: "blocked",
          config,
          durationMs: Date.now() - started,
          extraErrors: inputValidation.errors,
        });
      }

      const scope = config.certificationScope;
      const programmeScope = input.programmeScope;
      const shouldRun = (programmeId: string): boolean => {
        if (programmeScope && programmeScope.length > 0) {
          return programmeScope.includes(programmeId);
        }
        if (scope === "full" || scope === "integration") return true;
        if (scope === "marketplace") return programmeId === "R1";
        if (scope === "supplier") return programmeId === "R2";
        if (scope === "financial") return programmeId === "R3";
        if (scope === "customer") return programmeId === "R4";
        if (scope === "marketing") return programmeId === "R5";
        return true;
      };

      const programmeResults: ProgrammeValidationResult[] = [];
      if (shouldRun("R1")) {
        programmeResults.push(this.programmeCoordinator.validateMarketplace(ctx, config));
      }
      if (shouldRun("R2")) {
        programmeResults.push(this.programmeCoordinator.validateSupplier(ctx, config));
      }
      if (shouldRun("R3")) {
        programmeResults.push(this.programmeCoordinator.validateFinancial(ctx, config));
      }
      if (shouldRun("R4")) {
        programmeResults.push(this.programmeCoordinator.validateCustomer(ctx, config));
      }
      if (shouldRun("R5")) {
        programmeResults.push(this.programmeCoordinator.validateMarketing(ctx, config));
      }

      const endToEnd = this.endToEndValidator.validate(programmeResults);
      const integration = this.crossProgrammeValidator.validate(ctx, programmeResults);
      const readiness = this.readinessEngine.evaluate({
        programmeResults,
        endToEndWorkflowResult: endToEnd.result,
        crossProgrammeIntegrationResult: integration.result,
        config,
      });

      const configValidation = this.certificationValidator.validateConfiguration(config);
      let report = this.reportGenerator.generate({
        programmeResults,
        endToEndWorkflowResult: endToEnd.result,
        crossProgrammeIntegrationResult: integration.result,
        operationalReadinessScore: readiness.operationalReadinessScore,
        autonomousOperationalReadiness: readiness.autonomousOperationalReadiness,
        validation: configValidation,
        recoveryStatus: "stable",
        config,
        durationMs: Date.now() - started,
        extraWarnings: [
          ...endToEnd.warnings,
          ...integration.warnings,
          ...readiness.warnings,
          ...inputValidation.warnings,
        ],
        extraErrors: [...endToEnd.errors, ...integration.errors],
        extraEvidence: [
          ...endToEnd.evidenceReferences,
          ...integration.evidenceReferences,
          "governance:grand-king",
        ],
      });

      const reportValidation = this.certificationValidator.validateReport(report);
      if (reportValidation.decision === "fail") {
        report = {
          ...report,
          validation: reportValidation,
          errors: [...report.errors, ...reportValidation.errors],
          overallCertificationStatus: "failed",
          productionMutationAttempted: false,
        };
      } else if (reportValidation.warnings.length > 0) {
        report = {
          ...report,
          warnings: [...report.warnings, ...reportValidation.warnings],
          productionMutationAttempted: false,
        };
      } else {
        report = { ...report, productionMutationAttempted: false };
      }

      appendRwocLog({
        event: "certification_completion",
        level: report.overallCertificationStatus === "failed" ? "warn" : "info",
        details: `RWOC complete · status=${report.overallCertificationStatus} · readiness=${report.operationalReadinessScore}`,
      });

      return report;
    } finally {
      this.running = false;
    }
  }
}
