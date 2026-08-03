import type { WorkerRegistryConfiguration } from "./configuration.js";
import { REGISTRY_VERSION, WRG_METADATA_VERSION } from "./paths.js";
import type {
  RegistryDecision,
  WorkerRecord,
  WorkerRegistryCatalog,
  WorkerRegistryInput,
} from "./types.js";

export type RegistryEvaluation = {
  catalog: WorkerRegistryCatalog;
  registryDecision: RegistryDecision;
  workersRegistered: string[];
  reportingValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Registry definition helpers for Q1-07. */
export class RegistryBuilder {
  buildCatalog(
    config: WorkerRegistryConfiguration,
    workers: WorkerRecord[],
  ): WorkerRegistryCatalog {
    return {
      registryVersion: config.registryVersion || REGISTRY_VERSION,
      workers: workers.map(cloneWorker),
      metadataVersion: WRG_METADATA_VERSION,
      governingAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildWorker(
    input: WorkerRegistryInput,
    config: WorkerRegistryConfiguration,
    existingIds: Set<string>,
  ): WorkerRecord {
    workerSequence += 1;
    let workerId = input.workerId?.trim() || "";
    if (!workerId) {
      workerId = `wkr-${Date.now()}-${workerSequence}`;
    }
    while (existingIds.has(workerId)) {
      workerSequence += 1;
      workerId = `wkr-${Date.now()}-${workerSequence}`;
    }
    const timestamp = new Date().toISOString();
    return {
      registryVersion: config.registryVersion || REGISTRY_VERSION,
      workerId,
      workerName: input.workerName?.trim() || workerId,
      workerType: input.workerType?.trim() || "specialist",
      department: input.department?.trim() || "operations",
      factory: input.factory?.trim() || "workforce-factory",
      role: input.role?.trim() || "role-specialist-domain",
      reportingLine: unique(
        input.reportingLine ?? [workerId, "role-manager-department", "pillow"],
      ),
      governingAuthority: "pillow",
      skillProfile: unique(input.skillProfile ?? ["skill-ops-foundation"]),
      approvedTools: unique(input.approvedTools ?? ["structured_reporting"]),
      authorityLevel: input.authorityLevel?.trim() || "manager_approval",
      certificationStatus: input.certificationStatus?.toString().trim() || "pending",
      operationalStatus: input.operationalStatus?.toString().trim() || "registered",
      createdDate: timestamp,
      lastUpdated: timestamp,
      metadataVersion: WRG_METADATA_VERSION,
      versionHistory: [
        {
          version: 1,
          updatedAt: timestamp,
          changeSummary: input.changeSummary?.trim() || "registered",
        },
      ],
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: WorkerRegistryInput,
    config: WorkerRegistryConfiguration,
    workers: WorkerRecord[],
    target?: WorkerRecord | null,
  ): RegistryEvaluation {
    const catalog = this.buildCatalog(config, workers);
    const rules = unique(input.registryRules ?? config.registryRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const focus =
      target ??
      workers.find((w) => w.workerId === input.workerId?.trim()) ??
      workers[0] ??
      null;

    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, workers, focus, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    const reportingValidated =
      !failed.includes("reporting_relationship_defined") &&
      (focus?.reportingLine.length ?? 0) > 0 &&
      !!focus?.reportingLine.includes("pillow");

    let registryDecision: RegistryDecision = "valid";
    if (failed.length === 0) registryDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) {
      registryDecision = "partially_valid";
    } else registryDecision = "invalid";

    return {
      catalog,
      registryDecision,
      workersRegistered: catalog.workers.map((w) => w.workerId),
      reportingValidated,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerRegistryInput,
    catalog: WorkerRegistryCatalog,
    workers: WorkerRecord[],
    target: WorkerRecord | null,
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "unique_worker_id": {
        if (!target?.workerId) return false;
        return workers.filter((w) => w.workerId === target.workerId).length === 1;
      }
      case "one_primary_role":
        return !!target?.role?.trim() && !String(target.role).includes(",");
      case "one_department":
        return !!target?.department?.trim() && !String(target.department).includes(",");
      case "one_factory":
        return !!target?.factory?.trim() && !String(target.factory).includes(",");
      case "pillow_governing_authority":
        return target?.governingAuthority === "pillow" && catalog.governingAuthority === "pillow";
      case "reporting_relationship_defined":
        return (target?.reportingLine.length ?? 0) > 0;
      case "skill_profile_defined":
        return (target?.skillProfile.length ?? 0) > 0;
      case "approved_tools_defined":
        return (target?.approvedTools.length ?? 0) > 0;
      case "authority_level_defined":
        return !!target?.authorityLevel?.trim();
      case "certification_status_defined":
        return !!target?.certificationStatus;
      case "no_unregistered_execution":
        return input.executeWorkerTasks !== true && catalog.workers.length > 0;
      default:
        return input.overridePillow !== true;
    }
  }
}

let workerSequence = 0;

export function resetWorkerSequenceForTesting() {
  workerSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneWorker(worker: WorkerRecord): WorkerRecord {
  return {
    ...worker,
    reportingLine: [...worker.reportingLine],
    skillProfile: [...worker.skillProfile],
    approvedTools: [...worker.approvedTools],
    versionHistory: worker.versionHistory.map((v) => ({ ...v })),
  };
}
