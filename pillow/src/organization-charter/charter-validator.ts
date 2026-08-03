import { OCH_METADATA_VERSION } from "./paths.js";
import type {
  OrganizationCharterDefinition,
  OrganizationCharterInput,
  OrganizationCharterValidationReport,
  OrganizationStructureRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkforceOperatingSystem?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CharterValidator {
  decide(
    input: OrganizationCharterInput,
  ): OrganizationCharterValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: OrganizationStructureRecord[] | null,
    input: OrganizationCharterInput,
    started: number,
  ): OrganizationCharterValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Organization Charter requires validated=true");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") warnings.push("No structure records were produced yet");
    } else {
      for (const record of records) {
        if (!record.structureRecordId) errors.push("Missing structure record ID");
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workforceOperatingSystemReplaced) {
          errors.push("workforceOperatingSystemReplaced must remain false");
        }
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  validateCharter(
    charter: OrganizationCharterDefinition | null,
    input: OrganizationCharterInput,
    started: number,
  ): OrganizationCharterValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!charter) errors.push("Organization Charter definition missing");
    else {
      if (!charter.charterVersion) errors.push("Missing charter version");
      if (charter.executiveAuthority !== "pillow") {
        errors.push("Executive authority must be pillow");
      }
      if (!charter.factories.length) warnings.push("No factories registered");
      if (!charter.departments.length) warnings.push("No departments registered");
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceOperatingSystem === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Organization Charter must never execute worker tasks");
    }
    if (input.replaceWorkforceOperatingSystem === true) {
      errors.push("Organization Charter must never replace Workforce Operating System");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Organization Charter must never replace Workforce Orchestrator");
    }
    if (input.overridePillow === true) {
      errors.push("Organization Charter must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Organization Charter must never override Grand King");
    }
  }

  finalize(
    decision: OrganizationCharterValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): OrganizationCharterValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `och-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OCH_METADATA_VERSION,
    };
  }
}

export class OrganizationCharterMetadataGenerator {
  generate(structureCount: number, factoryCount: number) {
    return {
      metadataVersion: OCH_METADATA_VERSION,
      engineVersion: "PILLOW-OCH-001" as const,
      missionId: "Q1-02" as const,
      structureCount,
      factoryCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: OrganizationCharterValidationReport["decision"] | null, enabled: boolean) {
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
