import { appendRiengLog } from "./rieng-logging.js";
import type { IntegrationHandshake, IntegrationTarget } from "./types.js";

export type AiInnovationFactoryHandle = {
  getQ1301ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1301OrLater?: boolean;
  };
  getState?: () => unknown;
};

export type ImplementationSpecificationEngineHandle = {
  getQ1302ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1302OrLater?: boolean;
    specificationPrerequisite?: boolean;
  };
  getState?: () => unknown;
};

/** @deprecated Use ImplementationSpecificationEngineHandle */
export type Q1301MissionEngineHandle = ImplementationSpecificationEngineHandle;

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

export type RepositoryIntelligenceEngineDependencies = {
  aiInnovationFactory?: AiInnovationFactoryHandle | null;
  implementationSpecificationEngine?: ImplementationSpecificationEngineHandle | null;
  /** @deprecated Use implementationSpecificationEngine */
  q1301MissionEngine?: ImplementationSpecificationEngineHandle | null;
  intelligenceContext?: IntelligenceContextHandle | null;
  auditRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngineHandle | null;
  monitoringRuntime?: RuntimeHandle | null;
};

function resolveImplementationSpecificationEngine(
  deps: RepositoryIntelligenceEngineDependencies,
): ImplementationSpecificationEngineHandle | null | undefined {
  return deps.implementationSpecificationEngine ?? deps.q1301MissionEngine;
}

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: RepositoryIntelligenceEngineDependencies = {};

  bind(deps: RepositoryIntelligenceEngineDependencies = {}) {
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
      appendRiengLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "ai_innovation_factory":
        return Boolean(this.deps.aiInnovationFactory);
      case "implementation_specification_engine":
        return Boolean(resolveImplementationSpecificationEngine(this.deps));
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
      case "monitoring_runtime":
        return Boolean(this.deps.monitoringRuntime);
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${workerId} -> ${target}: ${status}`;
  }
}

export function verifyIntegrations(deps: RepositoryIntelligenceEngineDependencies) {
  const targets: IntegrationTarget[] = [
    "ai_innovation_factory",
    "implementation_specification_engine",
    "intelligence_context",
    "audit_runtime",
    "executive_reporting_runtime",
    "pillow_orchestration_runtime",
    "empire_knowledge_engine",
    "monitoring_runtime",
  ];
  return targets.map((target) => ({
    target,
    bound: integrationBound(deps, target),
  }));
}

function integrationBound(deps: RepositoryIntelligenceEngineDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "ai_innovation_factory":
      return Boolean(deps.aiInnovationFactory);
    case "implementation_specification_engine":
      return Boolean(resolveImplementationSpecificationEngine(deps));
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
    case "monitoring_runtime":
      return Boolean(deps.monitoringRuntime);
    default:
      return false;
  }
}
