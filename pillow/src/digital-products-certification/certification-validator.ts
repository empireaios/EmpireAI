import { DPC_METADATA_VERSION } from "./paths.js";
import type {
  DigitalProductsCertificationInput,
  DigitalProductsCertificationReport,
  DigitalProductsCertificationValidationReport,
} from "./types.js";

type BoundaryInput = {
  automaticallyFixFailures?: boolean;
  automaticallyCertifyIncompleteWork?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  beginQ6Implementation?: boolean;
  assumeImplementation?: boolean;
  implementQ601OrLater?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: DigitalProductsCertificationInput,
  ): DigitalProductsCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: DigitalProductsCertificationReport[] | null,
    input: DigitalProductsCertificationInput,
    started: number,
  ): DigitalProductsCertificationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Digital Products Certification requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        errors.push("No digital products certification reports were produced");
      }
    } else {
      for (const report of reports) {
        if (!report.certificationId) errors.push("Missing certification ID");
        if (!report.factoryVersion?.trim()) errors.push("Missing factory version");
        if (!report.missionVerificationMatrix.length) {
          warnings.push(`No mission verification matrix for ${report.certificationId}`);
        }
        if (!report.workerVerificationMatrix.length) {
          warnings.push(`No worker verification matrix for ${report.certificationId}`);
        }
        if (!report.executiveSummary?.trim()) errors.push("Missing executive summary");
        if (!report.certificationStatus) errors.push("Missing certification status");
        if (report.q6ReadinessConfirmed) {
          errors.push("q6ReadinessConfirmed must remain false");
        }
        if (report.failuresFixedAutomatically) {
          errors.push("failuresFixedAutomatically must remain false");
        }
        if (report.incompleteWorkAutoCertified) {
          errors.push("incompleteWorkAutoCertified must remain false");
        }
        if (report.q6ImplementationBegun) {
          errors.push("q6ImplementationBegun must remain false");
        }
        if (report.implementationAssumed) {
          errors.push("implementationAssumed must remain false");
        }
        if (report.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (report.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        for (const issue of report.outstandingIssues.filter(
          (i) => i.status === "Failed" || i.status === "Missing",
        )) {
          if (!issue.rootCause || !issue.evidence || !issue.impact || !issue.recommendedRemediation) {
            warnings.push(`Outstanding issue ${issue.issueId} missing remediation fields`);
          }
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.automaticallyFixFailures === true ||
      input.automaticallyCertifyIncompleteWork === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.beginQ6Implementation === true ||
      input.assumeImplementation === true ||
      input.implementQ601OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.automaticallyFixFailures === true) {
      errors.push("Digital Products Certification must never automatically fix failures");
    }
    if (input.automaticallyCertifyIncompleteWork === true) {
      errors.push("Digital Products Certification must never automatically certify incomplete work");
    }
    if (input.overridePillow === true) {
      errors.push("Digital Products Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Digital Products Certification must never override Grand King");
    }
    if (input.beginQ6Implementation === true) {
      errors.push("Digital Products Certification must never begin Q6 implementation");
    }
    if (input.assumeImplementation === true) {
      errors.push("Digital Products Certification must never assume implementation");
    }
    if (input.implementQ601OrLater === true) {
      errors.push("Digital Products Certification must never implement Q6-01 or later");
    }
  }

  finalize(
    decision: DigitalProductsCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DigitalProductsCertificationValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `dpc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DPC_METADATA_VERSION,
    };
  }
}

export class DigitalProductsCertificationMetadataGenerator {
  generate(reportCount: number, certifiedCount: number) {
    return {
      metadataVersion: DPC_METADATA_VERSION,
      engineVersion: "PILLOW-DPC-001" as const,
      missionId: "Q5-12" as const,
      reportCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: DigitalProductsCertificationValidationReport["decision"] | null,
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
