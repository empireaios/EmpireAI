import { RTX_METADATA_VERSION } from "./paths.js";
import type {
  RoleDefinition,
  RoleInheritanceBinding,
  RoleTaxonomyCatalog,
  RoleTaxonomyInput,
  RoleTaxonomyValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceOrganizationCharter?: boolean;
  replaceWorkerConstitution?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class TaxonomyValidator {
  decide(input: RoleTaxonomyInput): RoleTaxonomyValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: RoleInheritanceBinding[] | null,
    input: RoleTaxonomyInput,
    started: number,
  ): RoleTaxonomyValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Role Taxonomy requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail") warnings.push("No inheritance records were produced yet");
    } else {
      for (const record of records) {
        if (!record.inheritanceId) errors.push("Missing inheritance ID");
        if (!record.inherited) errors.push("Worker must inherit a taxonomy role");
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.organizationCharterReplaced) {
          errors.push("organizationCharterReplaced must remain false");
        }
        if (record.workerConstitutionReplaced) {
          errors.push("workerConstitutionReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  validateCatalog(
    catalog: RoleTaxonomyCatalog | null,
    roles: RoleDefinition[],
    input: RoleTaxonomyInput,
    started: number,
  ): RoleTaxonomyValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Role Taxonomy catalog missing");
    else {
      if (!catalog.taxonomyVersion) errors.push("Missing taxonomy version");
      if (!roles.length) warnings.push("No roles registered");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceOrganizationCharter === true ||
      input.replaceWorkerConstitution === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Role Taxonomy must never execute worker tasks");
    }
    if (input.replaceOrganizationCharter === true) {
      errors.push("Role Taxonomy must never replace Organization Charter");
    }
    if (input.replaceWorkerConstitution === true) {
      errors.push("Role Taxonomy must never replace Worker Constitution");
    }
    if (input.overridePillow === true) {
      errors.push("Role Taxonomy must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Role Taxonomy must never override Grand King");
    }
  }

  finalize(
    decision: RoleTaxonomyValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RoleTaxonomyValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `rtx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RTX_METADATA_VERSION,
    };
  }
}

export class RoleTaxonomyMetadataGenerator {
  generate(roleCount: number, inheritanceCount: number) {
    return {
      metadataVersion: RTX_METADATA_VERSION,
      engineVersion: "PILLOW-RTX-001" as const,
      missionId: "Q1-03" as const,
      roleCount,
      inheritanceCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: RoleTaxonomyValidationReport["decision"] | null, enabled: boolean) {
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
