import { appendMpengLog } from "./mpeng-logging.js";
import type { IntegrationHandshake, IntegrationTarget } from "./types.js";

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
      moduleInventory?: unknown[];
      serviceInventory?: unknown[];
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
    specifications?: unknown[];
    architectureSummary?: unknown;
  } | null;
  getState?: () => unknown;
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

export type MissionPlanningEngineDependencies = {
  repositoryIntelligenceEngine?: RepositoryIntelligenceEngineHandle | null;
  implementationSpecificationEngine?: ImplementationSpecificationEngineHandle | null;
  intelligenceContext?: IntelligenceContextHandle | null;
  auditRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngineHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: MissionPlanningEngineDependencies = {};

  bind(deps: MissionPlanningEngineDependencies = {}) {
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
      appendMpengLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "repository_intelligence_engine":
        return Boolean(this.deps.repositoryIntelligenceEngine);
      case "implementation_specification_engine":
        return Boolean(this.deps.implementationSpecificationEngine);
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

export function verifyIntegrations(deps: MissionPlanningEngineDependencies) {
  const targets: IntegrationTarget[] = [
    "repository_intelligence_engine",
    "implementation_specification_engine",
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

function integrationBound(deps: MissionPlanningEngineDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "repository_intelligence_engine":
      return Boolean(deps.repositoryIntelligenceEngine);
    case "implementation_specification_engine":
      return Boolean(deps.implementationSpecificationEngine);
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
