import { appendEesaeLog } from "./eesae-logging.js";
import type { IntegrationHandshake, IntegrationTarget } from "./types.js";

export type MonitoringRuntimeHandle = {
  getState?: () => {
    health?: { status?: string; healthScore?: number; totalAlerts?: number };
    latestReport?: { alerts?: Array<{ severity?: string; message?: string }> };
  };
  getCockpitSnapshot?: () => unknown;
  list?: (input?: unknown) => { components?: Array<{ componentId?: string; currentStatus?: string }> };
  generateAlerts?: (input?: unknown) => { alerts?: Array<{ severity?: string; message?: string; componentId?: string }> };
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => { records?: Array<{ reportId?: string }> };
};

export type AuditRuntimeHandle = {
  getState?: () => unknown;
  recordAuditEvent?: (payload: unknown) => unknown;
};

export type PillowOrchestrationRuntimeHandle = {
  getState?: () => { status?: string };
  getTopology?: () => unknown;
};

export type DigitalSoulRuntimeHandle = {
  getSnapshot?: () => unknown;
  recordExecutiveDecision?: (input: Record<string, unknown>) => unknown;
};

export type WorkerRegistryHandle = {
  listWorkers?: () => Array<{ workerId?: string; status?: string; failureCount?: number }>;
  getWorker?: (workerId: string) => { workerId?: string; status?: string; failureCount?: number };
};

export type CommerceIntelligenceHandle = {
  getSnapshot?: () => {
    revenue?: number;
    orders?: number;
    conversions?: number;
    evidenceRefs?: string[];
  };
  getState?: () => unknown;
};

export type EmpireKnowledgeEngineHandle = {
  getSnapshot?: () => Record<string, unknown>;
  getState?: () => unknown;
};

export type ProgrammeCertificationFactoryHandle = {
  getState?: () => { health?: { status?: string; healthScore?: number } };
  getCockpitSnapshot?: () => unknown;
};

export type QueueRuntimeHandle = {
  getState?: () => { queueDepth?: number; pendingJobs?: number };
  getHistory?: () => unknown;
};

export type MemoryRuntimeHandle = {
  getState?: () => { memoryUsageMb?: number; pressure?: string };
};

export type RecoveryRuntimeHandle = {
  getState?: () => { status?: string; activeRecoveries?: number };
};

export type SharedRuntimeCoreHandle = {
  getTopology?: () => unknown;
};

export type IntelligenceContextHandle = {
  getSnapshot?: () => Record<string, unknown>;
};

export type EnterpriseExecutiveSituationalAwarenessEngineDependencies = {
  monitoringRuntime?: MonitoringRuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle | null;
  digitalSoulRuntime?: DigitalSoulRuntimeHandle | null;
  digitalSoul?: DigitalSoulRuntimeHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  commerceIntelligence?: CommerceIntelligenceHandle | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngineHandle | null;
  programmeCertificationFactory?: ProgrammeCertificationFactoryHandle | null;
  queueRuntime?: QueueRuntimeHandle | null;
  memoryRuntime?: MemoryRuntimeHandle | null;
  recoveryRuntime?: RecoveryRuntimeHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  intelligenceContext?: IntelligenceContextHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies = {};

  bind(deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies = {}) {
    this.deps = { ...deps };
    if (deps.digitalSoul && !deps.digitalSoulRuntime) {
      this.deps.digitalSoulRuntime = deps.digitalSoul;
    }
  }

  getDependencies() {
    return this.deps;
  }

  getDigitalSoulHandle() {
    return this.deps.digitalSoulRuntime ?? this.deps.digitalSoul ?? null;
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
        details: `${workerId} -> ${target}: ${status}`,
        timestamp: now,
      };
      resolved.push(handshake);
      appendEesaeLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "monitoring_runtime":
        return Boolean(this.deps.monitoringRuntime);
      case "executive_reporting_runtime":
        return Boolean(this.deps.executiveReportingRuntime);
      case "audit_runtime":
        return Boolean(this.deps.auditRuntime);
      case "pillow_orchestration_runtime":
        return Boolean(this.deps.pillowOrchestrationRuntime);
      case "digital_soul_runtime":
        return Boolean(this.getDigitalSoulHandle());
      case "worker_registry":
        return Boolean(this.deps.workerRegistry);
      case "commerce_intelligence":
        return Boolean(this.deps.commerceIntelligence);
      case "empire_knowledge_engine":
        return Boolean(this.deps.empireKnowledgeEngine);
      case "programme_certification_factory":
        return Boolean(this.deps.programmeCertificationFactory);
      case "queue_runtime":
        return Boolean(this.deps.queueRuntime);
      case "memory_runtime":
        return Boolean(this.deps.memoryRuntime);
      case "recovery_runtime":
        return Boolean(this.deps.recoveryRuntime);
      case "shared_runtime_core":
        return Boolean(this.deps.sharedRuntimeCore);
      case "intelligence_context":
        return Boolean(this.deps.intelligenceContext);
      default:
        return false;
    }
  }
}

export function verifyIntegrations(deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies) {
  const targets: IntegrationTarget[] = [
    "monitoring_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "pillow_orchestration_runtime",
    "digital_soul_runtime",
    "worker_registry",
    "commerce_intelligence",
    "empire_knowledge_engine",
    "programme_certification_factory",
    "queue_runtime",
    "memory_runtime",
    "recovery_runtime",
    "shared_runtime_core",
    "intelligence_context",
  ];
  return targets.map((target) => ({
    target,
    bound: integrationBound(deps, target),
  }));
}

function integrationBound(
  deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies,
  target: IntegrationTarget,
): boolean {
  switch (target) {
    case "monitoring_runtime":
      return Boolean(deps.monitoringRuntime);
    case "executive_reporting_runtime":
      return Boolean(deps.executiveReportingRuntime);
    case "audit_runtime":
      return Boolean(deps.auditRuntime);
    case "pillow_orchestration_runtime":
      return Boolean(deps.pillowOrchestrationRuntime);
    case "digital_soul_runtime":
      return Boolean(deps.digitalSoulRuntime ?? deps.digitalSoul);
    case "worker_registry":
      return Boolean(deps.workerRegistry);
    case "commerce_intelligence":
      return Boolean(deps.commerceIntelligence);
    case "empire_knowledge_engine":
      return Boolean(deps.empireKnowledgeEngine);
    case "programme_certification_factory":
      return Boolean(deps.programmeCertificationFactory);
    case "queue_runtime":
      return Boolean(deps.queueRuntime);
    case "memory_runtime":
      return Boolean(deps.memoryRuntime);
    case "recovery_runtime":
      return Boolean(deps.recoveryRuntime);
    case "shared_runtime_core":
      return Boolean(deps.sharedRuntimeCore);
    case "intelligence_context":
      return Boolean(deps.intelligenceContext);
    default:
      return false;
  }
}
