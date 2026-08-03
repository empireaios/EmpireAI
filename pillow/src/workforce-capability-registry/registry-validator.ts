import { LOOKUP_DIMENSIONS, WCR_METADATA_VERSION, WORKER_STATUSES } from "./paths.js";
import type {
  LookupInput,
  RegisterCatalogInput,
  RegisterWorkerInput,
  RegistryRecord,
  RegistryValidationReport,
  UpdateWorkerStatusInput,
  WorkforceCapabilityRegistryInput,
} from "./types.js";

type BoundaryInput = {
  executeWork?: boolean;
  assignWorkers?: boolean;
  orchestrateWorkers?: boolean;
  approveActions?: boolean;
  replacePillow?: boolean;
  validated?: boolean;
};

export class RegistryValidator {
  decideBoundary(input: BoundaryInput): RegistryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  decideWorker(input: RegisterWorkerInput): RegistryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.workerId?.trim() || !input.workerName?.trim() || !input.department?.trim()) return "fail";
    if ((input.capabilityList?.length ?? 0) === 0) return "partial";
    return "pass";
  }

  decideCatalog(input: RegisterCatalogInput): RegistryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.id?.trim() || !input.name?.trim()) return "fail";
    return "pass";
  }

  decideStatus(input: UpdateWorkerStatusInput): RegistryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.workerId?.trim()) return "fail";
    if (!(WORKER_STATUSES as readonly string[]).includes(input.currentStatus)) return "fail";
    return "pass";
  }

  decideLookup(input: LookupInput): RegistryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.query?.trim()) return "fail";
    if (!(LOOKUP_DIMENSIONS as readonly string[]).includes(input.dimension)) return "fail";
    return "pass";
  }

  validateRecords(
    records: RegistryRecord[] | null,
    input: WorkforceCapabilityRegistryInput,
    started: number,
  ): RegistryValidationReport {
    const decision = this.decideBoundary(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Workforce Capability Registry requires validated=true");
    if (!records || records.length === 0) {
      if (decision !== "fail") warnings.push("No registry records available");
    } else {
      for (const record of records) {
        if (!record.registryId) errors.push("Missing registry ID");
        if (!record.workerId) errors.push("Worker ID is required");
        if (!record.workerName) errors.push("Worker name is required");
        if (!record.department) errors.push("Department is required");
        if (!record.capabilityList.length) warnings.push(`Empty capability list for ${record.workerId}`);
        if (record.workExecuted) errors.push("workExecuted must remain false");
        if (record.workersAssigned) errors.push("workersAssigned must remain false");
        if (record.workersOrchestrated) errors.push("workersOrchestrated must remain false");
        if (record.actionsApproved) errors.push("actionsApproved must remain false");
        if (record.pillowReplaced) errors.push("pillowReplaced must remain false");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWork === true ||
      input.assignWorkers === true ||
      input.orchestrateWorkers === true ||
      input.approveActions === true ||
      input.replacePillow === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWork === true) errors.push("Workforce Capability Registry must never execute work");
    if (input.assignWorkers === true) errors.push("Workforce Capability Registry must never assign workers");
    if (input.orchestrateWorkers === true) {
      errors.push("Workforce Capability Registry must never orchestrate workers");
    }
    if (input.approveActions === true) errors.push("Workforce Capability Registry must never approve actions");
    if (input.replacePillow === true) errors.push("Workforce Capability Registry must never replace Pillow");
  }

  finalize(
    decision: RegistryValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RegistryValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `wcr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WCR_METADATA_VERSION,
    };
  }
}

export class RegistryMetadataGenerator {
  generate(counts: {
    workers: number;
    departments: number;
    capabilities: number;
    tools: number;
    skills: number;
  }) {
    return {
      metadataVersion: WCR_METADATA_VERSION,
      engineVersion: "PILLOW-WCR-001" as const,
      missionId: "Q0-10" as const,
      ...counts,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: RegistryValidationReport["decision"] | null, enabled: boolean) {
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
    return {
      recoveryAttempted: true,
      failures: this.failures,
      workExecuted: false as const,
      workersAssigned: false as const,
      workersOrchestrated: false as const,
      actionsApproved: false as const,
      pillowReplaced: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
