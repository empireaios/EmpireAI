import { STX_METADATA_VERSION } from "./paths.js";
import type {
  SkillDefinition,
  SkillTaxonomyCatalog,
  SkillTaxonomyInput,
  SkillTaxonomyValidationReport,
  WorkerSkillBinding,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceRoleTaxonomy?: boolean;
  replaceWorkforceCapabilityRegistry?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class TaxonomyValidator {
  decide(input: SkillTaxonomyInput): SkillTaxonomyValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: WorkerSkillBinding[] | null,
    input: SkillTaxonomyInput,
    started: number,
  ): SkillTaxonomyValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Skill Taxonomy requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail") warnings.push("No worker skill derivation records were produced yet");
    } else {
      for (const record of records) {
        if (!record.derivationId) errors.push("Missing derivation ID");
        if (!record.derived) errors.push("Worker must derive skills from taxonomy");
        if (!record.skillIds.length) errors.push("Worker must possess one or more skills");
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.roleTaxonomyReplaced) errors.push("roleTaxonomyReplaced must remain false");
        if (record.workforceCapabilityRegistryReplaced) {
          errors.push("workforceCapabilityRegistryReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  validateCatalog(
    catalog: SkillTaxonomyCatalog | null,
    skills: SkillDefinition[],
    input: SkillTaxonomyInput,
    started: number,
  ): SkillTaxonomyValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Skill Taxonomy catalog missing");
    else {
      if (!catalog.taxonomyVersion) errors.push("Missing taxonomy version");
      if (!skills.length) warnings.push("No skills registered");
      if (!catalog.proficiencyLevels.length) errors.push("Proficiency levels missing");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceRoleTaxonomy === true ||
      input.replaceWorkforceCapabilityRegistry === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Skill Taxonomy must never execute worker tasks");
    }
    if (input.replaceRoleTaxonomy === true) {
      errors.push("Skill Taxonomy must never replace Role Taxonomy");
    }
    if (input.replaceWorkforceCapabilityRegistry === true) {
      errors.push("Skill Taxonomy must never replace Workforce Capability Registry");
    }
    if (input.overridePillow === true) {
      errors.push("Skill Taxonomy must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Skill Taxonomy must never override Grand King");
    }
  }

  finalize(
    decision: SkillTaxonomyValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SkillTaxonomyValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `stx-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: STX_METADATA_VERSION,
    };
  }
}

export class SkillTaxonomyMetadataGenerator {
  generate(skillCount: number, derivationCount: number) {
    return {
      metadataVersion: STX_METADATA_VERSION,
      engineVersion: "PILLOW-STX-001" as const,
      missionId: "Q1-04" as const,
      skillCount,
      derivationCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: SkillTaxonomyValidationReport["decision"] | null, enabled: boolean) {
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
