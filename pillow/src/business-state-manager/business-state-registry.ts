import {
  BSM_METADATA_VERSION,
} from "./paths.js";
import type {
  BusinessDependencies,
  BusinessHealthStatus,
  BusinessLifecycleState,
  BusinessPhase,
  BusinessProgressSummary,
  BusinessState,
  BusinessStateValidationReport,
  RegisterBusinessInput,
  UpdateBusinessStateInput,
  ValidationStatus,
} from "./types.js";

const ACTIVE_STATES: BusinessLifecycleState[] = [
  "planned",
  "building",
  "testing",
  "waiting_approval",
  "operating",
  "paused",
  "recovering",
];

function isLifecycle(value: string): value is BusinessLifecycleState {
  return (
    value === "planned" ||
    value === "building" ||
    value === "testing" ||
    value === "waiting_approval" ||
    value === "operating" ||
    value === "paused" ||
    value === "recovering" ||
    value === "archived"
  );
}

function isHealth(value: string): value is BusinessHealthStatus {
  return value === "healthy" || value === "warning" || value === "critical";
}

function isPhase(value: string): value is BusinessPhase {
  return (
    value === "intake" ||
    value === "construction" ||
    value === "validation" ||
    value === "approval_gate" ||
    value === "production" ||
    value === "maintenance" ||
    value === "recovery" ||
    value === "closure"
  );
}

function defaultPhaseForState(state: BusinessLifecycleState): BusinessPhase {
  switch (state) {
    case "planned":
      return "intake";
    case "building":
      return "construction";
    case "testing":
      return "validation";
    case "waiting_approval":
      return "approval_gate";
    case "operating":
      return "production";
    case "paused":
      return "maintenance";
    case "recovering":
      return "recovery";
    case "archived":
      return "closure";
  }
}

function mergeDependencies(
  base: BusinessDependencies,
  patch?: Partial<BusinessDependencies>,
): BusinessDependencies {
  return {
    requiredInfrastructure: [...(patch?.requiredInfrastructure ?? base.requiredInfrastructure)],
    requiredApis: [...(patch?.requiredApis ?? base.requiredApis)],
    requiredWorkforceCategories: [...(patch?.requiredWorkforceCategories ?? base.requiredWorkforceCategories)],
    requiredApprovals: [...(patch?.requiredApprovals ?? base.requiredApprovals)],
  };
}

function progressFrom(
  activeMissions: string[],
  completedMissions: string[],
  pendingApprovals: string[],
  blockers: string[],
): BusinessProgressSummary {
  return {
    activeMissions: activeMissions.length,
    completedMissions: completedMissions.length,
    pendingApprovals: pendingApprovals.length,
    currentBlockers: blockers.length,
  };
}

function boundaryViolated(input: {
  executeMissions?: boolean;
  assignWorkers?: boolean;
  approveActions?: boolean;
  launchBusinesses?: boolean;
  makeStrategicDecisions?: boolean;
}): boolean {
  return (
    input.executeMissions === true ||
    input.assignWorkers === true ||
    input.approveActions === true ||
    input.launchBusinesses === true ||
    input.makeStrategicDecisions === true
  );
}

export class BusinessStateRegistry {
  private readonly businesses = new Map<string, BusinessState>();
  private sequence = 0;

  list(): BusinessState[] {
    return [...this.businesses.values()].map((b) => this.clone(b));
  }

  get(businessId: string): BusinessState | null {
    const found = this.businesses.get(businessId);
    return found ? this.clone(found) : null;
  }

  count(): number {
    return this.businesses.size;
  }

  activeCount(): number {
    return [...this.businesses.values()].filter((b) => ACTIVE_STATES.includes(b.currentState)).length;
  }

  register(input: RegisterBusinessInput, validationStatus: ValidationStatus): BusinessState {
    const name = input.name.trim();
    this.sequence += 1;
    const businessId = (input.businessId?.trim() || `bsm-biz-${Date.now()}-${this.sequence}`).toLowerCase();
    if (this.businesses.has(businessId)) {
      throw new Error(`Business already registered: ${businessId}`);
    }
    const currentState = input.currentState && isLifecycle(input.currentState) ? input.currentState : "planned";
    const currentPhase =
      input.currentPhase && isPhase(input.currentPhase) ? input.currentPhase : defaultPhaseForState(currentState);
    const healthStatus =
      input.healthStatus && isHealth(input.healthStatus) ? input.healthStatus : "healthy";
    const activeMissions = [...(input.activeMissions ?? [])];
    const completedMissions = [...(input.completedMissions ?? [])];
    const pendingApprovals = [...(input.pendingApprovals ?? [])];
    const blockers = [...(input.blockers ?? [])];
    const dependencies = mergeDependencies(
      {
        requiredInfrastructure: [],
        requiredApis: [],
        requiredWorkforceCategories: [],
        requiredApprovals: [],
      },
      input.dependencies,
    );
    const record: BusinessState = {
      businessId,
      name,
      category: (input.category ?? "general").trim() || "general",
      businessType: (input.businessType ?? "enterprise").trim() || "enterprise",
      owner: (input.owner ?? "pillow").trim() || "pillow",
      currentState,
      currentPhase,
      healthStatus,
      progressSummary: progressFrom(activeMissions, completedMissions, pendingApprovals, blockers),
      activeMissions,
      completedMissions,
      pendingApprovals,
      blockers,
      dependencies,
      lastUpdateTimestamp: new Date().toISOString(),
      version: 1,
      metadataVersion: BSM_METADATA_VERSION,
      stateTraceId: `bsm-trace-${Date.now()}`,
      validationStatus,
      neverExecuteMissions: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverLaunchBusinesses: true,
      neverMakeStrategicDecisions: true,
      missionsExecuted: false,
      workersAssigned: false,
      actionsApproved: false,
      businessLaunchedByManager: false,
      strategicDecisionMade: false,
      preserveStateTraceability: true,
      preserveAuditability: true,
      preserveStateIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    this.businesses.set(businessId, record);
    return this.clone(record);
  }

  update(input: UpdateBusinessStateInput, validationStatus: ValidationStatus): BusinessState {
    const existing = this.businesses.get(input.businessId);
    if (!existing) throw new Error(`Business not found: ${input.businessId}`);
    if (input.currentState && !isLifecycle(input.currentState)) {
      throw new Error(`Invalid lifecycle state: ${input.currentState}`);
    }
    if (input.healthStatus && !isHealth(input.healthStatus)) {
      throw new Error(`Invalid health status: ${input.healthStatus}`);
    }
    if (input.currentPhase && !isPhase(input.currentPhase)) {
      throw new Error(`Invalid phase: ${input.currentPhase}`);
    }

    const currentState = input.currentState ?? existing.currentState;
    const currentPhase =
      input.currentPhase ??
      (input.currentState ? defaultPhaseForState(input.currentState) : existing.currentPhase);
    const activeMissions = input.activeMissions ? [...input.activeMissions] : [...existing.activeMissions];
    const completedMissions = input.completedMissions
      ? [...input.completedMissions]
      : [...existing.completedMissions];
    const pendingApprovals = input.pendingApprovals
      ? [...input.pendingApprovals]
      : [...existing.pendingApprovals];
    const blockers = input.blockers ? [...input.blockers] : [...existing.blockers];

    const updated: BusinessState = {
      ...existing,
      currentState,
      currentPhase,
      healthStatus: input.healthStatus ?? existing.healthStatus,
      activeMissions,
      completedMissions,
      pendingApprovals,
      blockers,
      dependencies: mergeDependencies(existing.dependencies, input.dependencies),
      progressSummary: progressFrom(activeMissions, completedMissions, pendingApprovals, blockers),
      lastUpdateTimestamp: new Date().toISOString(),
      version: existing.version + 1,
      validationStatus,
      missionsExecuted: false,
      workersAssigned: false,
      actionsApproved: false,
      businessLaunchedByManager: false,
      strategicDecisionMade: false,
    };
    this.businesses.set(updated.businessId, updated);
    return this.clone(updated);
  }

  query(filters: {
    businessId?: string;
    currentState?: BusinessLifecycleState;
    healthStatus?: BusinessHealthStatus;
    category?: string;
  }): BusinessState[] {
    return this.list().filter((b) => {
      if (filters.businessId && b.businessId !== filters.businessId) return false;
      if (filters.currentState && b.currentState !== filters.currentState) return false;
      if (filters.healthStatus && b.healthStatus !== filters.healthStatus) return false;
      if (filters.category && b.category !== filters.category) return false;
      return true;
    });
  }

  private clone(record: BusinessState): BusinessState {
    return {
      ...record,
      activeMissions: [...record.activeMissions],
      completedMissions: [...record.completedMissions],
      pendingApprovals: [...record.pendingApprovals],
      blockers: [...record.blockers],
      progressSummary: { ...record.progressSummary },
      dependencies: {
        requiredInfrastructure: [...record.dependencies.requiredInfrastructure],
        requiredApis: [...record.dependencies.requiredApis],
        requiredWorkforceCategories: [...record.dependencies.requiredWorkforceCategories],
        requiredApprovals: [...record.dependencies.requiredApprovals],
      },
    };
  }
}

export class BusinessStateValidator {
  decide(input: {
    validated?: boolean;
    executeMissions?: boolean;
    assignWorkers?: boolean;
    approveActions?: boolean;
    launchBusinesses?: boolean;
    makeStrategicDecisions?: boolean;
  }): BusinessStateValidationReport["decision"] {
    if (boundaryViolated(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: BusinessState[],
    input: {
      validated?: boolean;
      executeMissions?: boolean;
      assignWorkers?: boolean;
      approveActions?: boolean;
      launchBusinesses?: boolean;
      makeStrategicDecisions?: boolean;
      name?: string;
      businessId?: string;
    },
    started: number,
  ): BusinessStateValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (input.executeMissions === true) errors.push("Business State Manager must never execute missions");
    if (input.assignWorkers === true) errors.push("Business State Manager must never assign workers");
    if (input.approveActions === true) errors.push("Business State Manager must never approve actions");
    if (input.launchBusinesses === true) errors.push("Business State Manager must never launch businesses");
    if (input.makeStrategicDecisions === true) {
      errors.push("Business State Manager must never make strategic decisions");
    }
    if (input.validated === false) errors.push("State operations require validated=true");

    for (const record of records) {
      if (!record.businessId) errors.push("Missing business ID");
      if (!record.name) errors.push(`Missing name for ${record.businessId}`);
      if (!isLifecycle(record.currentState)) errors.push(`Invalid lifecycle for ${record.businessId}`);
      if (!isHealth(record.healthStatus)) errors.push(`Invalid health for ${record.businessId}`);
      if (record.missionsExecuted) errors.push("missionsExecuted must remain false");
      if (record.workersAssigned) errors.push("workersAssigned must remain false");
      if (record.actionsApproved) errors.push("actionsApproved must remain false");
      if (record.businessLaunchedByManager) errors.push("businessLaunchedByManager must remain false");
      if (record.strategicDecisionMade) errors.push("strategicDecisionMade must remain false");
      if (
        record.progressSummary.activeMissions !== record.activeMissions.length ||
        record.progressSummary.completedMissions !== record.completedMissions.length ||
        record.progressSummary.pendingApprovals !== record.pendingApprovals.length ||
        record.progressSummary.currentBlockers !== record.blockers.length
      ) {
        errors.push(`Progress summary inconsistent for ${record.businessId}`);
      }
    }

    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";

    return {
      validationReportId: `bsm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BSM_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: BusinessStateValidationReport["decision"] | null, enabled: boolean) {
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
      missionsExecuted: false as const,
      workersAssigned: false as const,
      actionsApproved: false as const,
      businessLaunchedByManager: false as const,
      strategicDecisionMade: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
