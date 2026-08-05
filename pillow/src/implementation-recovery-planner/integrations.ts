import { appendIrplnLog } from "./irpln-logging.js";
import type { IntegrationHandshake, IntegrationTarget } from "./types.js";

export type CursorSpecificationGeneratorHandle = {
  getQ1305ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1305OrLater?: boolean;
    specificationPrerequisite?: boolean;
  };
  getLatestSpecification?: () => {
    cursorSpecificationId?: string;
    missionId?: string;
    missionName?: string;
    deliverable?: string;
    architecture?: string[];
    acceptanceCriteria?: string[];
    existingImplementationsToPreserve?: string[];
  } | null;
  getLatestReport?: () => {
    reportId?: string;
    confidenceScore?: number;
    generatedCursorSpecification?: unknown;
  } | null;
  getState?: () => unknown;
};

export type RepositoryIntelligenceEngineHandle = {
  getLatestReport?: () => {
    reportId?: string;
    confidenceScore?: number;
    snapshot?: {
      repositorySnapshotId?: string;
      repositoryFingerprint?: string;
      repositoryVersion?: string;
    };
    repositorySummary?: { totalFiles?: number; totalModules?: number };
  } | null;
  getState?: () => unknown;
};

export type ImplementationSpecificationEngineHandle = {
  getLatestReport?: () => {
    reportId?: string;
    specifications?: Array<{ specId?: string; missionId?: string; missionName?: string }>;
  } | null;
  getState?: () => unknown;
};

export type MissionPlanningEngineHandle = {
  getLatestReport?: () => {
    reportId?: string;
    confidenceScore?: number;
    plans?: Array<{ planId?: string; missionId?: string; missionName?: string }>;
  } | null;
  getState?: () => unknown;
};

export type RuntimeHandle = {
  getState?: () => { status?: string } | unknown;
  getCatalog?: () => unknown;
  getTopology?: () => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => { records?: Array<{ reportId?: string }> };
};

export type EmpireKnowledgeEngineHandle = {
  getState?: () => unknown;
};

export type ImplementationRecoveryPlannerDependencies = {
  cursorSpecificationGenerator?: CursorSpecificationGeneratorHandle | null;
  repositoryIntelligenceEngine?: RepositoryIntelligenceEngineHandle | null;
  implementationSpecificationEngine?: ImplementationSpecificationEngineHandle | null;
  missionPlanningEngine?: MissionPlanningEngineHandle | null;
  auditRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngineHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: ImplementationRecoveryPlannerDependencies = {};

  bind(deps: ImplementationRecoveryPlannerDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((handshake) => ({ ...handshake }));
  }

  connect(workerId: string, targets: string[]): IntegrationHandshake[] {
    const now = new Date().toISOString();
    const resolved: IntegrationHandshake[] = [];
    for (const target of targets as IntegrationTarget[]) {
      const status = this.isBound(target) ? "bound" : "ready";
      const handshake: IntegrationHandshake = {
        target,
        status,
        details: this.describe(target, workerId, status),
        timestamp: now,
      };
      resolved.push(handshake);
      appendIrplnLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "cursor_specification_generator":
        return Boolean(this.deps.cursorSpecificationGenerator);
      case "repository_intelligence_engine":
        return Boolean(this.deps.repositoryIntelligenceEngine);
      case "implementation_specification_engine":
        return Boolean(this.deps.implementationSpecificationEngine);
      case "mission_planning_engine":
        return Boolean(this.deps.missionPlanningEngine);
      case "audit_runtime":
        return Boolean(this.deps.auditRuntime);
      case "executive_reporting_runtime":
        return Boolean(this.deps.executiveReportingRuntime);
      case "pillow_orchestration_runtime":
        return Boolean(this.deps.pillowOrchestrationRuntime);
      case "empire_knowledge_engine":
        return Boolean(this.deps.empireKnowledgeEngine);
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${workerId} -> ${target}: ${status}`;
  }
}

export function verifyIntegrations(deps: ImplementationRecoveryPlannerDependencies) {
  const targets: IntegrationTarget[] = [
    "cursor_specification_generator",
    "repository_intelligence_engine",
    "implementation_specification_engine",
    "mission_planning_engine",
    "audit_runtime",
    "executive_reporting_runtime",
    "pillow_orchestration_runtime",
    "empire_knowledge_engine",
  ];
  return targets.map((target) => ({
    target,
    bound: integrationBound(deps, target),
  }));
}

function integrationBound(deps: ImplementationRecoveryPlannerDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "cursor_specification_generator":
      return Boolean(deps.cursorSpecificationGenerator);
    case "repository_intelligence_engine":
      return Boolean(deps.repositoryIntelligenceEngine);
    case "implementation_specification_engine":
      return Boolean(deps.implementationSpecificationEngine);
    case "mission_planning_engine":
      return Boolean(deps.missionPlanningEngine);
    case "audit_runtime":
      return Boolean(deps.auditRuntime);
    case "executive_reporting_runtime":
      return Boolean(deps.executiveReportingRuntime);
    case "pillow_orchestration_runtime":
      return Boolean(deps.pillowOrchestrationRuntime);
    case "empire_knowledge_engine":
      return Boolean(deps.empireKnowledgeEngine);
    default:
      return false;
  }
}
