import { AMX_METADATA_VERSION } from "./paths.js";
import type {
  AuthorityBinding,
  AuthorityMatrixCatalog,
  AuthorityMatrixInput,
  AuthorityMatrixValidationReport,
  AuthorityRuleDefinition,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceApprovalRouter?: boolean;
  replaceOrganizationCharter?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class MatrixValidator {
  decide(input: AuthorityMatrixInput): AuthorityMatrixValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateBindings(
    bindings: AuthorityBinding[] | null,
    input: AuthorityMatrixInput,
    started: number,
  ): AuthorityMatrixValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Authority Matrix requires validated=true");
    }
    if (!bindings || bindings.length === 0) {
      if (decision !== "fail") warnings.push("No authority bindings were produced yet");
    } else {
      for (const binding of bindings) {
        if (!binding.bindingId) errors.push("Missing binding ID");
        if (!binding.derived) errors.push("Authority must be derived from the matrix");
        if (!binding.authorityIds.length) errors.push("Binding must reference authority rules");
        if (binding.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (binding.approvalRouterReplaced) {
          errors.push("approvalRouterReplaced must remain false");
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
    catalog: AuthorityMatrixCatalog | null,
    rules: AuthorityRuleDefinition[],
    input: AuthorityMatrixInput,
    started: number,
  ): AuthorityMatrixValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Authority Matrix catalog missing");
    else {
      if (!catalog.matrixVersion) errors.push("Missing matrix version");
      if (!rules.length) warnings.push("No authority rules registered");
      if (!catalog.authorityLevels.length) errors.push("Authority levels missing");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
      if (catalog.supremeAuthority !== "grand_king") {
        errors.push("Supreme authority must remain grand_king");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceApprovalRouter === true ||
      input.replaceOrganizationCharter === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Authority Matrix must never execute worker tasks");
    }
    if (input.replaceApprovalRouter === true) {
      errors.push("Authority Matrix must never replace Approval Router");
    }
    if (input.replaceOrganizationCharter === true) {
      errors.push("Authority Matrix must never replace Organization Charter");
    }
    if (input.overridePillow === true) {
      errors.push("Authority Matrix must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Authority Matrix must never override Grand King");
    }
  }

  finalize(
    decision: AuthorityMatrixValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AuthorityMatrixValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `amx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMX_METADATA_VERSION,
    };
  }
}

export class AuthorityMatrixMetadataGenerator {
  generate(ruleCount: number, bindingCount: number) {
    return {
      metadataVersion: AMX_METADATA_VERSION,
      engineVersion: "PILLOW-AMX-001" as const,
      missionId: "Q1-05" as const,
      ruleCount,
      bindingCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: AuthorityMatrixValidationReport["decision"] | null, enabled: boolean) {
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
