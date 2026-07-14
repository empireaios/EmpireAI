import {
  assembleExecutiveResilienceEngine,
  buildFallbackExecutiveResilienceEngine,
  getResilienceConfiguration,
  getResilienceAuditHistory,
} from "@empireai/pillow";
import type {
  ExecutiveResilienceEngine,
  ResilienceIncidentRecord,
  ResilienceEngineConfiguration,
} from "@empireai/pillow";

/** Fallback Executive Resilience Engine when Pillow session is unavailable. */
export function collectExecutiveResilienceEngineSnapshot() {
  const engine = buildFallbackExecutiveResilienceEngine();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-14",
    live: false,
    executiveResilienceEngine: engine,
  };
}

export function getEnterpriseHealthStatus(): {
  computedAt: string;
  enterpriseHealthScore: number;
  operationalReadinessScore: number;
  recoveryReadinessScore: number;
  enterpriseHealth: ExecutiveResilienceEngine["enterpriseHealth"];
  continuityStatus: ExecutiveResilienceEngine["continuityStatus"];
} {
  const engine = buildFallbackExecutiveResilienceEngine();
  return {
    computedAt: new Date().toISOString(),
    enterpriseHealthScore: engine.enterpriseHealthScore,
    operationalReadinessScore: engine.operationalReadinessScore,
    recoveryReadinessScore: engine.recoveryReadinessScore,
    enterpriseHealth: engine.enterpriseHealth,
    continuityStatus: engine.continuityStatus,
  };
}

export function getExecutiveResilienceReport() {
  const engine = buildFallbackExecutiveResilienceEngine();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getActiveResilienceIncidents(): {
  computedAt: string;
  activeIncidents: ExecutiveResilienceEngine["activeIncidents"];
  recoveryProgress: ExecutiveResilienceEngine["recoveryProgress"];
  register: ResilienceIncidentRecord[];
} {
  const engine = buildFallbackExecutiveResilienceEngine();
  return {
    computedAt: new Date().toISOString(),
    activeIncidents: engine.activeIncidents,
    recoveryProgress: engine.recoveryProgress,
    register: engine.resilienceIncidentRegister,
  };
}

export function getExecutiveResilienceHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getResilienceAuditHistory>;
  configuration: ResilienceEngineConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getResilienceAuditHistory(100),
    configuration: getResilienceConfiguration(),
  };
}

export function getExecutiveResilienceHealth() {
  const engine = buildFallbackExecutiveResilienceEngine();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    resilienceHealth: engine.resilienceHealth,
  };
}

export { assembleExecutiveResilienceEngine, buildFallbackExecutiveResilienceEngine };
