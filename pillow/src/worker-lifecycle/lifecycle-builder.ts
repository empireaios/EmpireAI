import type { WorkerLifecycleConfiguration } from "./configuration.js";
import { LIFECYCLE_VERSION, WLC_METADATA_VERSION } from "./paths.js";
import type {
  LifecycleDecision,
  LifecycleEvent,
  LifecycleRecord,
  LifecycleState,
  WorkerLifecycleCatalog,
  WorkerLifecycleInput,
  WorkerLifecycleProfile,
} from "./types.js";

export type TransitionPlan = {
  event: LifecycleEvent;
  previousState: LifecycleState | null;
  newState: LifecycleState;
  requiresPillowApproval: boolean;
  errors: string[];
};

export type LifecycleEvaluation = {
  catalog: WorkerLifecycleCatalog;
  lifecycleDecision: LifecycleDecision;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Lifecycle transition helpers for Q1-08. */
export class LifecycleBuilder {
  buildCatalog(
    config: WorkerLifecycleConfiguration,
    profiles: WorkerLifecycleProfile[],
    records: LifecycleRecord[],
  ): WorkerLifecycleCatalog {
    return {
      lifecycleVersion: LIFECYCLE_VERSION,
      states: [...config.lifecycleStates],
      profiles: profiles.map(cloneProfile),
      records: records.map(cloneRecord),
      metadataVersion: WLC_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerRegistry: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverPermanentlyDeleted: true,
    };
  }

  planTransition(
    event: LifecycleEvent,
    profile: WorkerLifecycleProfile | null,
    input: WorkerLifecycleInput,
  ): TransitionPlan {
    const previousState = (profile?.currentState as LifecycleState | undefined) ?? null;
    const errors: string[] = [];
    let newState: LifecycleState = previousState ?? "created";
    let requiresPillowApproval = false;

    switch (event) {
      case "create": {
        if (profile) errors.push("Worker already exists in lifecycle");
        newState = "registered";
        break;
      }
      case "onboard": {
        if (!profile) errors.push("Worker must be created before onboarding");
        else if (previousState !== "registered") {
          errors.push("Worker must be registered before onboarding");
        }
        newState = "onboarding";
        break;
      }
      case "configure": {
        if (!profile) errors.push("Worker missing for configuration");
        else if (previousState !== "onboarding" && previousState !== "configured") {
          errors.push("Worker must be onboarding before configuration");
        }
        newState = "configured";
        break;
      }
      case "certify": {
        if (!profile) errors.push("Worker missing for certification");
        else if (previousState !== "configured" && previousState !== "certified") {
          errors.push("Worker must be configured before certification");
        }
        newState = "certified";
        break;
      }
      case "activate": {
        if (!profile) errors.push("Worker missing for activation");
        else if (
          previousState !== "certified" &&
          previousState !== "idle" &&
          previousState !== "recovering" &&
          previousState !== "active"
        ) {
          errors.push("Worker must be certified before production activation");
        }
        newState = "active";
        break;
      }
      case "suspend": {
        if (!profile) errors.push("Worker missing for suspension");
        else if (
          previousState !== "active" &&
          previousState !== "busy" &&
          previousState !== "idle"
        ) {
          errors.push("Worker must be active, busy, or idle before suspension");
        }
        newState = "suspended";
        break;
      }
      case "resume": {
        if (!profile) errors.push("Worker missing for resumption");
        else if (previousState !== "suspended" && previousState !== "recovering") {
          errors.push("Worker must be suspended or recovering before resume");
        }
        newState = "active";
        break;
      }
      case "replace": {
        requiresPillowApproval = true;
        if (!profile) errors.push("Worker missing for replacement");
        if (!isPillowApproval(input.approvedBy)) {
          errors.push("Replacement requires Pillow authorization");
        }
        newState = "replaced";
        break;
      }
      case "retire": {
        requiresPillowApproval = true;
        if (!profile) errors.push("Worker missing for retirement");
        if (!isPillowApproval(input.approvedBy)) {
          errors.push("Retirement requires Pillow authorization");
        }
        if (previousState === "archived") {
          errors.push("Archived workers cannot be retired again");
        }
        newState = "retired";
        break;
      }
      case "archive": {
        if (!profile) errors.push("Worker missing for archival");
        else if (previousState !== "retired" && previousState !== "replaced") {
          errors.push("Worker must be retired or replaced before archival");
        }
        newState = "archived";
        break;
      }
      case "restore": {
        requiresPillowApproval = true;
        if (!profile) errors.push("Worker missing for restoration");
        else if (previousState !== "archived" && previousState !== "retired") {
          errors.push("Only archived or retired workers may be restored");
        }
        if (!isPillowApproval(input.approvedBy)) {
          errors.push("Restoration requires Pillow authorization");
        }
        newState = "recovering";
        break;
      }
      case "audit": {
        if (!profile) errors.push("Worker missing for audit");
        newState = (previousState ?? "registered") as LifecycleState;
        break;
      }
      default:
        errors.push(`Unknown lifecycle event: ${event}`);
    }

    if (input.permanentlyDelete === true) {
      errors.push("Workers must never be permanently deleted");
    }

    return { event, previousState, newState, requiresPillowApproval, errors };
  }

  buildRecord(params: {
    input: WorkerLifecycleInput;
    event: LifecycleEvent;
    previousState: LifecycleState | null;
    newState: LifecycleState;
    workerId: string;
    workerName: string;
  }): LifecycleRecord {
    lifecycleSequence += 1;
    return {
      lifecycleId:
        params.input.lifecycleId?.trim() ||
        `wlc-${Date.now()}-${lifecycleSequence}`,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      workerName: params.workerName,
      lifecycleEvent: params.event,
      previousState: params.previousState,
      newState: params.newState,
      triggerReason: params.input.triggerReason?.trim() || `${params.event}_requested`,
      requestedBy: params.input.requestedBy?.trim() || "pillow",
      approvedBy: params.input.approvedBy?.trim() || null,
      supportingEvidence: unique(params.input.supportingEvidence ?? [`event=${params.event}`]),
      metadataVersion: WLC_METADATA_VERSION,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerRegistry: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      permanentlyDeleted: false,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: WorkerLifecycleInput,
    config: WorkerLifecycleConfiguration,
    profiles: WorkerLifecycleProfile[],
    records: LifecycleRecord[],
    planErrors: string[] = [],
  ): LifecycleEvaluation {
    const catalog = this.buildCatalog(config, profiles, records);
    const rules = unique(input.rules ?? config.lifecycleRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const target =
      profiles.find((p) => p.workerId === input.workerId?.trim()) ?? profiles[0] ?? null;

    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, target, records, planErrors, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    let lifecycleDecision: LifecycleDecision = "valid";
    if (failed.length === 0 && planErrors.length === 0) lifecycleDecision = "valid";
    else if (failed.length + planErrors.length <= Math.ceil(rules.length / 3)) {
      lifecycleDecision = "partially_valid";
    } else lifecycleDecision = "invalid";

    return {
      catalog,
      lifecycleDecision,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerLifecycleInput,
    catalog: WorkerLifecycleCatalog,
    target: WorkerLifecycleProfile | null,
    records: LifecycleRecord[],
    planErrors: string[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "registered_before_onboarding": {
        if (input.lifecycleEvent !== "onboard") return true;
        return target?.currentState === "registered" || planErrors.length === 0;
      }
      case "onboarded_before_activation": {
        if (input.lifecycleEvent !== "activate") return true;
        return (
          !!target &&
          ["certified", "idle", "recovering", "active", "onboarding", "configured"].includes(
            String(target.currentState),
          )
        );
      }
      case "certified_before_production_use": {
        if (input.lifecycleEvent !== "activate") return true;
        return (
          !!target &&
          (target.certified ||
            ["certified", "idle", "recovering", "active"].includes(String(target.currentState)))
        );
      }
      case "preserve_lifecycle_history":
        return records.every((r) => !!r.lifecycleId && !!r.timestamp);
      case "preserve_audit_records":
        return records.every((r) => r.preserveAuditability === true);
      case "preserve_traceability":
        return records.every((r) => r.preserveTraceability === true);
      case "pillow_authorization_for_retirement": {
        if (input.lifecycleEvent !== "retire") return true;
        return isPillowApproval(input.approvedBy);
      }
      case "pillow_authorization_for_replacement": {
        if (input.lifecycleEvent !== "replace") return true;
        return isPillowApproval(input.approvedBy);
      }
      case "never_permanently_deleted":
        return (
          input.permanentlyDelete !== true &&
          catalog.neverPermanentlyDeleted === true &&
          records.every((r) => r.permanentlyDeleted === false)
        );
      default:
        return input.overridePillow !== true;
    }
  }
}

let lifecycleSequence = 0;

export function resetLifecycleSequenceForTesting() {
  lifecycleSequence = 0;
}

function isPillowApproval(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "pillow" || normalized === "pillow_authority";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneRecord(record: LifecycleRecord): LifecycleRecord {
  return {
    ...record,
    supportingEvidence: [...record.supportingEvidence],
  };
}

function cloneProfile(profile: WorkerLifecycleProfile): WorkerLifecycleProfile {
  return {
    ...profile,
    history: profile.history.map(cloneRecord),
    neverPermanentlyDeleted: true,
  };
}
