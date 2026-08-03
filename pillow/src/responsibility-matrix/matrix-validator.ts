import { RMX_METADATA_VERSION } from "./paths.js";
import type {
  ResponsibilityBinding,
  ResponsibilityDefinition,
  ResponsibilityMatrixCatalog,
  ResponsibilityMatrixInput,
  ResponsibilityMatrixValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceAuthorityMatrix?: boolean;
  replaceOrganizationCharter?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class MatrixValidator {
  decide(input: ResponsibilityMatrixInput): ResponsibilityMatrixValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateBindings(
    bindings: ResponsibilityBinding[] | null,
    input: ResponsibilityMatrixInput,
    started: number,
  ): ResponsibilityMatrixValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Responsibility Matrix requires validated=true");
    }
    if (!bindings || bindings.length === 0) {
      if (decision !== "fail") warnings.push("No responsibility bindings were produced yet");
    } else {
      for (const binding of bindings) {
        if (!binding.bindingId) errors.push("Missing binding ID");
        if (!binding.derived) errors.push("Responsibility must be derived from the matrix");
        if (!binding.responsibilityIds.length) {
          errors.push("Binding must reference responsibilities");
        }
        if (binding.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (binding.authorityMatrixReplaced) {
          errors.push("authorityMatrixReplaced must remain false");
        }
        if (binding.organizationCharterReplaced) {
          errors.push("organizationCharterReplaced must remain false");
        }
        if (binding.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (binding.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  validateCatalog(
    catalog: ResponsibilityMatrixCatalog | null,
    responsibilities: ResponsibilityDefinition[],
    input: ResponsibilityMatrixInput,
    started: number,
  ): ResponsibilityMatrixValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Responsibility Matrix catalog missing");
    else {
      if (!catalog.matrixVersion) errors.push("Missing matrix version");
      if (!responsibilities.length) warnings.push("No responsibilities registered");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
      const ownerCounts = new Map<string, number>();
      for (const r of responsibilities) {
        ownerCounts.set(r.responsibilityId, (ownerCounts.get(r.responsibilityId) ?? 0) + 1);
        if (!r.primaryOwner?.trim()) errors.push(`Missing owner for ${r.responsibilityId}`);
        if (r.primaryOwner.includes(",")) {
          errors.push(`Ambiguous owner for ${r.responsibilityId}`);
        }
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceAuthorityMatrix === true ||
      input.replaceOrganizationCharter === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Responsibility Matrix must never execute worker tasks");
    }
    if (input.replaceAuthorityMatrix === true) {
      errors.push("Responsibility Matrix must never replace Authority Matrix");
    }
    if (input.replaceOrganizationCharter === true) {
      errors.push("Responsibility Matrix must never replace Organization Charter");
    }
    if (input.overridePillow === true) {
      errors.push("Responsibility Matrix must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Responsibility Matrix must never override Grand King");
    }
  }

  finalize(
    decision: ResponsibilityMatrixValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ResponsibilityMatrixValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `rmx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RMX_METADATA_VERSION,
    };
  }
}

export class ResponsibilityMatrixMetadataGenerator {
  generate(responsibilityCount: number, bindingCount: number) {
    return {
      metadataVersion: RMX_METADATA_VERSION,
      engineVersion: "PILLOW-RMX-001" as const,
      missionId: "Q1-06" as const,
      responsibilityCount,
      bindingCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: ResponsibilityMatrixValidationReport["decision"] | null,
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
