import { CMC_METADATA_VERSION } from "./paths.js";
import type {
  CommerceCertificationInput,
  CommerceCertificationReport,
  CommerceCertificationValidationReport,
} from "./types.js";

type BoundaryInput = {
  operateLiveCommerceBusiness?: boolean;
  modifyCommerceFactoryComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ4Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: CommerceCertificationInput,
  ): CommerceCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: CommerceCertificationReport[] | null,
    input: CommerceCertificationInput,
    started: number,
  ): CommerceCertificationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Commerce Certification requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        errors.push("No commerce certification reports were produced");
      }
    } else {
      for (const report of reports) {
        if (!report.certificationId) errors.push("Missing certification ID");
        if (!report.commerceFactoryVersion?.trim()) {
          errors.push("Missing commerce factory version");
        }
        if (!report.componentsTested.length) {
          warnings.push(`No components tested for ${report.certificationId}`);
        }
        if (!report.operationalReadiness) {
          errors.push("Missing operational readiness");
        }
        if (!report.traceabilityChain.length) {
          warnings.push(`No traceability chain for ${report.certificationId}`);
        }
        if (report.liveCommerceBusinessOperated) {
          errors.push("liveCommerceBusinessOperated must remain false");
        }
        if (report.commerceFactoryComponentsModified) {
          errors.push("commerceFactoryComponentsModified must remain false");
        }
        if (report.failuresRepairedAutomatically) {
          errors.push("failuresRepairedAutomatically must remain false");
        }
        if (report.q4ImplementationBegun) {
          errors.push("q4ImplementationBegun must remain false");
        }
        if (report.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (report.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.operateLiveCommerceBusiness === true ||
      input.modifyCommerceFactoryComponents === true ||
      input.repairFailuresAutomatically === true ||
      input.beginQ4Implementation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.operateLiveCommerceBusiness === true) {
      errors.push("Commerce Certification must never operate a live commerce business");
    }
    if (input.modifyCommerceFactoryComponents === true) {
      errors.push("Commerce Certification must never modify Commerce Factory components");
    }
    if (input.repairFailuresAutomatically === true) {
      errors.push("Commerce Certification must never repair failures automatically");
    }
    if (input.beginQ4Implementation === true) {
      errors.push("Commerce Certification must never begin Q4 implementation");
    }
    if (input.overridePillow === true) {
      errors.push("Commerce Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Commerce Certification must never override Grand King");
    }
  }

  finalize(
    decision: CommerceCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CommerceCertificationValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `cmc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CMC_METADATA_VERSION,
    };
  }
}

export class CommerceCertificationMetadataGenerator {
  generate(reportCount: number, certifiedCount: number) {
    return {
      metadataVersion: CMC_METADATA_VERSION,
      engineVersion: "PILLOW-CMC-001" as const,
      missionId: "Q3-14" as const,
      reportCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: CommerceCertificationValidationReport["decision"] | null,
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
