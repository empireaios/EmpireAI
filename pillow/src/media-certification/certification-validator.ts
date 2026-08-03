import { MDC_METADATA_VERSION } from "./paths.js";
import type {
  MediaCertificationInput,
  MediaCertificationReport,
  MediaCertificationValidationReport,
} from "./types.js";

type BoundaryInput = {
  publishMedia?: boolean;
  modifyMediaFactoryComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ5Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: MediaCertificationInput,
  ): MediaCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: MediaCertificationReport[] | null,
    input: MediaCertificationInput,
    started: number,
  ): MediaCertificationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Media Certification requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        errors.push("No media certification reports were produced");
      }
    } else {
      for (const report of reports) {
        if (!report.certificationId) errors.push("Missing certification ID");
        if (!report.mediaFactoryVersion?.trim()) {
          errors.push("Missing media factory version");
        }
        if (!report.componentsTested.length) {
          warnings.push(`No components tested for ${report.certificationId}`);
        }
        if (!report.autonomousOperationStatus) {
          errors.push("Missing autonomous operation status");
        }
        if (!report.traceabilityChain.length) {
          warnings.push(`No traceability chain for ${report.certificationId}`);
        }
        if (report.mediaPublished) {
          errors.push("mediaPublished must remain false");
        }
        if (report.mediaFactoryComponentsModified) {
          errors.push("mediaFactoryComponentsModified must remain false");
        }
        if (report.failuresRepairedAutomatically) {
          errors.push("failuresRepairedAutomatically must remain false");
        }
        if (report.q5ImplementationBegun) {
          errors.push("q5ImplementationBegun must remain false");
        }
        if (report.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (report.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.publishMedia === true ||
      input.modifyMediaFactoryComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ5Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.publishMedia === true) {
      errors.push("Media Certification must never publish media");
    }
    if (input.modifyMediaFactoryComponents === true) {
      errors.push("Media Certification must never modify Media Factory components");
    }
    if (input.repairFailuresAutomatically === true) {
      errors.push("Media Certification must never repair failures automatically");
    }
    if (input.beginQ5Implementation === true) {
      errors.push("Media Certification must never begin Q5 implementation");
    }
    if (input.overridePillow === true) {
      errors.push("Media Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Media Certification must never override Grand King");
    }
  }

  finalize(
    decision: MediaCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MediaCertificationValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `mdc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MDC_METADATA_VERSION,
    };
  }
}

export class MediaCertificationMetadataGenerator {
  generate(reportCount: number, certifiedCount: number) {
    return {
      metadataVersion: MDC_METADATA_VERSION,
      engineVersion: "PILLOW-MDC-001" as const,
      missionId: "Q4-19" as const,
      reportCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: MediaCertificationValidationReport["decision"] | null,
    enabled: boolean,
  ) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
