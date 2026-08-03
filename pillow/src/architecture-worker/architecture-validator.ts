import { ARW_METADATA_VERSION } from "./paths.js";

import type {

  ArchitectureReport,

  ArchitectureWorkerInput,

  ArchitectureWorkerValidationReport,

} from "./types.js";



type BoundaryInput = {

  writeFrontendCode?: boolean;

  writeBackendCode?: boolean;

  deployApplications?: boolean;

  implementApplicationLogic?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ604OrLater?: boolean;

  validated?: boolean;

};



export class ArchitectureValidator {

  decide(input: ArchitectureWorkerInput): ArchitectureWorkerValidationReport["decision"] {

    if (this.hasBoundaryViolation(input)) return "fail";

    if (input.validated === false) return "fail";

    return "pass";

  }



  validateArchitectureReports(

    reports: ArchitectureReport[] | null,

    input: ArchitectureWorkerInput,

    started: number,

    options: { allowIncompleteReport?: boolean } = {},

  ): ArchitectureWorkerValidationReport {

    const decision = this.decide(input);

    const errors: string[] = [];

    const warnings: string[] = [];

    const incompleteOk = options.allowIncompleteReport === true;

    this.pushBoundaryErrors(input, errors);

    if (input.validated === false) {

      errors.push("Architecture Worker requires validated=true");

    }

    if (!reports || reports.length === 0) {

      if (decision !== "fail") {

        warnings.push("No architecture reports were produced yet");

      }

    } else {

      for (const report of reports) {

        if (!report.architectureId) errors.push("Missing architecture ID");

        if (report.architectureId && !report.architectureId.startsWith("arw-arch-")) {

          errors.push("Architecture ID must start with arw-arch-");

        }

        if (!report.timestamp) errors.push("Missing timestamp");

        if (!report.platformId) errors.push("Missing platform ID");

        if (!report.platformName?.trim()) errors.push("Missing platform name");

        if (!report.systemOverview?.trim()) errors.push("Missing system overview");

        if (!Array.isArray(report.moduleArchitecture)) errors.push("Missing module architecture");

        if (!Array.isArray(report.apiArchitecture)) errors.push("Missing API architecture");

        if (!Array.isArray(report.dataFlow)) errors.push("Missing data flow");

        if (!Array.isArray(report.serviceDependencies)) {

          errors.push("Missing service dependencies");

        }

        if (!report.deploymentArchitecture) errors.push("Missing deployment architecture");

        if (!Array.isArray(report.integrationArchitecture)) {

          errors.push("Missing integration architecture");

        }

        if (!Array.isArray(report.securityConsiderations)) {

          errors.push("Missing security considerations");

        }

        if (!Array.isArray(report.scalabilityConsiderations)) {

          errors.push("Missing scalability considerations");

        }

        if (report.confidenceScore == null) errors.push("Missing confidence score");

        if (!report.metadataVersion) errors.push("Missing metadata version");

        if (!incompleteOk && report.moduleArchitecture.length === 0) {

          errors.push("Missing module architecture content");

        }

        if (!report.neverWriteFrontendCode) {

          errors.push("Architecture Worker must never write frontend code");

        }

        if (!report.neverWriteBackendCode) {

          errors.push("Architecture Worker must never write backend code");

        }

        if (!report.neverDeployApplications) {

          errors.push("Architecture Worker must never deploy applications");

        }

        if (!report.neverOverridePillow) {

          errors.push("Architecture Worker must never override Pillow");

        }

        if (!report.neverOverrideGrandKing) {

          errors.push("Architecture Worker must never override Grand King");

        }

        if (!report.neverImplementApplicationLogic) {

          errors.push("Architecture Worker must never implement application logic");

        }

        if (!report.neverImplementQ604OrLater) {

          errors.push("Architecture Worker must never implement Q6-04 or later");

        }

        if (!report.separateArchitecturalDecisionsFromAssumptions) {

          errors.push("Architecture Worker must separate architectural decisions from assumptions");

        }

        if (!report.preserveCompleteTraceability) {

          errors.push("Architecture Worker must preserve complete traceability");

        }

        if (!report.selfReviewPassed) {

          warnings.push(`Report ${report.architectureId} self-review did not fully pass`);

        }

        if (report.architecturalCompliance === "non_compliant") {

          warnings.push(`Report ${report.architectureId} architectural compliance is non_compliant`);

        }

        for (const assumption of report.assumptions) {

          for (const dec of report.architecturalDecisions) {

            if (dec.decision.includes(assumption)) {

              errors.push("Assumptions must be distinct from architectural decisions");

              break;

            }

          }

        }

      }

    }

    return this.finalize(

      errors.length || decision === "fail"

        ? "fail"

        : decision === "pass" && warnings.length

          ? "partial"

          : decision,

      errors,

      warnings,

      started,

    );

  }



  finalize(

    decision: ArchitectureWorkerValidationReport["decision"],

    errors: string[],

    warnings: string[],

    started: number,

  ): ArchitectureWorkerValidationReport {

    const finalDecision =

      errors.length || decision === "fail"

        ? "fail"

        : warnings.length || decision === "partial"

          ? "partial"

          : "pass";

    return {

      validationReportId: `arw-val-${Date.now()}`,

      validationTimestamp: new Date().toISOString(),

      decision: finalDecision,

      errors,

      warnings,

      durationMs: Date.now() - started,

      metadataVersion: ARW_METADATA_VERSION,

    };

  }



  hasBoundaryViolation(input: BoundaryInput) {

    return (

      input.writeFrontendCode === true ||

      input.writeBackendCode === true ||

      input.deployApplications === true ||

      input.implementApplicationLogic === true ||

      input.overridePillow === true ||

      input.overrideGrandKing === true ||

      input.implementQ604OrLater === true

    );

  }



  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {

    if (input.writeFrontendCode) {

      errors.push("Architecture Worker must never write frontend code");

    }

    if (input.writeBackendCode) {

      errors.push("Architecture Worker must never write backend code");

    }

    if (input.deployApplications) {

      errors.push("Architecture Worker must never deploy applications");

    }

    if (input.implementApplicationLogic) {

      errors.push("Architecture Worker must never implement application logic");

    }

    if (input.overridePillow) {

      errors.push("Architecture Worker must never override Pillow");

    }

    if (input.overrideGrandKing) {

      errors.push("Architecture Worker must never override Grand King");

    }

    if (input.implementQ604OrLater) {

      errors.push("Architecture Worker must never implement Q6-04 or later");

    }

  }

}



export class HealthMonitor {

  status(

    validationDecision: "pass" | "partial" | "fail",

    enabled: boolean,

  ): "healthy" | "degraded" | "failed" | "standby" {

    if (!enabled) return "standby";

    if (validationDecision === "fail") return "failed";

    if (validationDecision === "partial") return "degraded";

    return "healthy";

  }

}



export class RecoveryManager {

  private failures = 0;



  recordFailure() {

    this.failures += 1;

  }



  reset() {

    this.failures = 0;

  }



  getFailureCount() {

    return this.failures;

  }

}


