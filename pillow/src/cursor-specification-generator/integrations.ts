import { appendCsgenLog } from "./csgen-logging.js";
import type { IntegrationHandshake, IntegrationTarget } from "./types.js";

export type MissionPlanningEngineHandle = {
  getQ1304ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1304OrLater?: boolean;
    planningPrerequisite?: boolean;
  };
  getLatestReport?: () => {
    reportId?: string;
    confidenceScore?: number;
    plans?: Array<{
      planId?: string;
      missionId?: string;
      missionName?: string;
      executionOrder?: unknown[];
      acceptanceCriteria?: unknown[];
      validationStrategy?: unknown[];
    }>;
    missionSummary?: { missionId?: string; missionName?: string };
  } | null;
  getState?: () => unknown;
};

export type RepositoryIntelligenceEngineHandle = {
  getQ1303ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1303OrLater?: boolean;
    repositoryPrerequisite?: boolean;
  };
  getLatestReport?: () => {
    reportId?: string;
    confidenceScore?: number;
    snapshot?: {
      repositorySnapshotId?: string;
      repositoryFingerprint?: string;
      repositoryVersion?: string;
    };
    repositorySummary?: { totalFiles?: number; totalModules?: number };
    dependencySummary?: { nodeCount?: number; edgeCount?: number };
  } | null;
  getState?: () => unknown;
};

export type ImplementationSpecificationEngineHandle = {
  getQ1302ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1302OrLater?: boolean;
  };
  getLatestReport?: () => {
    reportId?: string;
    specifications?: Array<{ specId?: string; missionId?: string; missionName?: string }>;
    architectureSummary?: unknown;
  } | null;
  getState?: () => unknown;
};

export type ApprovalRuntimeHandle = {
  getState?: () => { status?: string; pendingApprovals?: number } | unknown;
};

export type GrandKingAcceptanceGateHandle = {
  getState?: () => { status?: string; gateOpen?: boolean } | unknown;
  getAcceptanceStatus?: () => { status?: string; approved?: boolean } | unknown;
};

export type IntelligenceContextHandle = {
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

export type CursorSpecificationGeneratorDependencies = {
  missionPlanningEngine?: MissionPlanningEngineHandle | null;
  repositoryIntelligenceEngine?: RepositoryIntelligenceEngineHandle | null;
  implementationSpecificationEngine?: ImplementationSpecificationEngineHandle | null;
  approvalRuntime?: ApprovalRuntimeHandle | null;
  grandKingAcceptanceGate?: GrandKingAcceptanceGateHandle | null;
  intelligenceContext?: IntelligenceContextHandle | null;
  auditRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngineHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: CursorSpecificationGeneratorDependencies = {};

  bind(deps: CursorSpecificationGeneratorDependencies = {}) {
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
      appendCsgenLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "mission_planning_engine":
        return Boolean(this.deps.missionPlanningEngine);
      case "repository_intelligence_engine":
        return Boolean(this.deps.repositoryIntelligenceEngine);
      case "implementation_specification_engine":
        return Boolean(this.deps.implementationSpecificationEngine);
      case "approval_runtime":
        return Boolean(this.deps.approvalRuntime);
      case "grand_king_acceptance_gate":
        return Boolean(this.deps.grandKingAcceptanceGate);
      case "intelligence_context":
        return Boolean(this.deps.intelligenceContext);
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

export function verifyIntegrations(deps: CursorSpecificationGeneratorDependencies) {
  const targets: IntegrationTarget[] = [
    "mission_planning_engine",
    "repository_intelligence_engine",
    "implementation_specification_engine",
    "approval_runtime",
    "grand_king_acceptance_gate",
    "intelligence_context",
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

function integrationBound(deps: CursorSpecificationGeneratorDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "mission_planning_engine":
      return Boolean(deps.missionPlanningEngine);
    case "repository_intelligence_engine":
      return Boolean(deps.repositoryIntelligenceEngine);
    case "implementation_specification_engine":
      return Boolean(deps.implementationSpecificationEngine);
    case "approval_runtime":
      return Boolean(deps.approvalRuntime);
    case "grand_king_acceptance_gate":
      return Boolean(deps.grandKingAcceptanceGate);
    case "intelligence_context":
      return Boolean(deps.intelligenceContext);
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
