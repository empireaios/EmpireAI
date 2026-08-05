import { appendPcfctLog } from "./pcfct-logging.js";
import type { IntegrationHandshake, IntegrationTarget } from "./types.js";

export type ImplementationRecoveryPlannerHandle = {
  getQ1306ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    neverImplementQ1306OrLater?: boolean;
    recoveryPrerequisite?: boolean;
  };
  getLatestReport?: () => {
    reportId?: string;
    confidenceScore?: number;
    recoveryAnalysis?: unknown;
  } | null;
  getLatestPlan?: () => { recoveryId?: string; missionId?: string } | null;
  getState?: () => unknown;
};

export type CursorSpecificationGeneratorHandle = {
  getLatestReport?: () => { reportId?: string; confidenceScore?: number } | null;
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
  } | null;
  getState?: () => unknown;
};

export type MissionPlanningEngineHandle = {
  getLatestReport?: () => {
    reportId?: string;
    plans?: Array<{ planId?: string; missionId?: string }>;
  } | null;
  getState?: () => unknown;
};

export type ImplementationSpecificationEngineHandle = {
  getLatestReport?: () => {
    reportId?: string;
    specifications?: Array<{ specId?: string; missionId?: string }>;
  } | null;
  getState?: () => unknown;
};

export type QSeriesCertificationHandle = {
  getLatestReport?: () => { reportId?: string; certificationDecision?: string } | null;
  getState?: () => unknown;
};

export type QSeriesCompletionHandle = {
  getLatestReport?: () => { reportId?: string; finalCompletionDecision?: string } | null;
  getState?: () => unknown;
};

export type ProductionCertificationCoreHandle = {
  getLatestReport?: () => { reportId?: string } | null;
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

export type ProgrammeCertificationFactoryDependencies = {
  implementationRecoveryPlanner?: ImplementationRecoveryPlannerHandle | null;
  cursorSpecificationGenerator?: CursorSpecificationGeneratorHandle | null;
  missionPlanningEngine?: MissionPlanningEngineHandle | null;
  repositoryIntelligenceEngine?: RepositoryIntelligenceEngineHandle | null;
  implementationSpecificationEngine?: ImplementationSpecificationEngineHandle | null;
  qSeriesCertification?: QSeriesCertificationHandle | null;
  qSeriesCompletion?: QSeriesCompletionHandle | null;
  productionCertificationCore?: ProductionCertificationCoreHandle | null;
  auditRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngineHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: ProgrammeCertificationFactoryDependencies = {};

  bind(deps: ProgrammeCertificationFactoryDependencies = {}) {
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
      appendPcfctLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "implementation_recovery_planner":
        return Boolean(this.deps.implementationRecoveryPlanner);
      case "cursor_specification_generator":
        return Boolean(this.deps.cursorSpecificationGenerator);
      case "mission_planning_engine":
        return Boolean(this.deps.missionPlanningEngine);
      case "repository_intelligence_engine":
        return Boolean(this.deps.repositoryIntelligenceEngine);
      case "implementation_specification_engine":
        return Boolean(this.deps.implementationSpecificationEngine);
      case "q_series_certification":
        return Boolean(this.deps.qSeriesCertification);
      case "q_series_completion":
        return Boolean(this.deps.qSeriesCompletion);
      case "production_certification_core":
        return Boolean(this.deps.productionCertificationCore);
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

export function verifyIntegrations(deps: ProgrammeCertificationFactoryDependencies) {
  const targets: IntegrationTarget[] = [
    "implementation_recovery_planner",
    "cursor_specification_generator",
    "mission_planning_engine",
    "repository_intelligence_engine",
    "implementation_specification_engine",
    "q_series_certification",
    "q_series_completion",
    "production_certification_core",
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

function integrationBound(deps: ProgrammeCertificationFactoryDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "implementation_recovery_planner":
      return Boolean(deps.implementationRecoveryPlanner);
    case "cursor_specification_generator":
      return Boolean(deps.cursorSpecificationGenerator);
    case "mission_planning_engine":
      return Boolean(deps.missionPlanningEngine);
    case "repository_intelligence_engine":
      return Boolean(deps.repositoryIntelligenceEngine);
    case "implementation_specification_engine":
      return Boolean(deps.implementationSpecificationEngine);
    case "q_series_certification":
      return Boolean(deps.qSeriesCertification);
    case "q_series_completion":
      return Boolean(deps.qSeriesCompletion);
    case "production_certification_core":
      return Boolean(deps.productionCertificationCore);
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
