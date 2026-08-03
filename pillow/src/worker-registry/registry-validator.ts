import { WRG_METADATA_VERSION } from "./paths.js";
import type {
  WorkerRecord,
  WorkerRegistryCatalog,
  WorkerRegistryInput,
  WorkerRegistryValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkforceCapabilityRegistry?: boolean;
  replaceOrganizationCharter?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class RegistryValidator {
  decide(input: WorkerRegistryInput): WorkerRegistryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateWorkers(
    workers: WorkerRecord[] | null,
    input: WorkerRegistryInput,
    started: number,
  ): WorkerRegistryValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Registry requires validated=true");
    }
    if (!workers || workers.length === 0) {
      if (decision !== "fail") warnings.push("No workers were registered yet");
    } else {
      const seen = new Set<string>();
      for (const worker of workers) {
        if (!worker.workerId) errors.push("Missing worker ID");
        if (seen.has(worker.workerId)) errors.push(`Duplicate worker ID ${worker.workerId}`);
        seen.add(worker.workerId);
        if (worker.governingAuthority !== "pillow") {
          errors.push(`Worker ${worker.workerId} must be governed by pillow`);
        }
        if (!worker.role) errors.push(`Worker ${worker.workerId} missing role`);
        if (!worker.department) errors.push(`Worker ${worker.workerId} missing department`);
        if (!worker.factory) errors.push(`Worker ${worker.workerId} missing factory`);
        if (!worker.reportingLine.length) {
          errors.push(`Worker ${worker.workerId} missing reporting line`);
        }
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  validateCatalog(
    catalog: WorkerRegistryCatalog | null,
    workers: WorkerRecord[],
    input: WorkerRegistryInput,
    started: number,
  ): WorkerRegistryValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Worker Registry catalog missing");
    else {
      if (!catalog.registryVersion) errors.push("Missing registry version");
      if (!workers.length) warnings.push("No workers registered");
      if (catalog.governingAuthority !== "pillow") {
        errors.push("Governing authority must remain pillow");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceCapabilityRegistry === true ||
      input.replaceOrganizationCharter === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Registry must never execute worker tasks");
    }
    if (input.replaceWorkforceCapabilityRegistry === true) {
      errors.push("Worker Registry must never replace Workforce Capability Registry");
    }
    if (input.replaceOrganizationCharter === true) {
      errors.push("Worker Registry must never replace Organization Charter");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Registry must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Registry must never override Grand King");
    }
  }

  finalize(
    decision: WorkerRegistryValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerRegistryValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wrg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WRG_METADATA_VERSION,
    };
  }
}

export class WorkerRegistryMetadataGenerator {
  generate(workerCount: number) {
    return {
      metadataVersion: WRG_METADATA_VERSION,
      engineVersion: "PILLOW-WRG-001" as const,
      missionId: "Q1-07" as const,
      workerCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: WorkerRegistryValidationReport["decision"] | null, enabled: boolean) {
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
