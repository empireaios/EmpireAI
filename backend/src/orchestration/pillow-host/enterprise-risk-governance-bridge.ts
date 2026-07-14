import {
  assembleEnterpriseRiskGovernance,
  buildFallbackEnterpriseRiskGovernance,
  getRiskConfiguration,
  getRiskAuditHistory,
} from "@empireai/pillow";
import type { EnterpriseRiskRecord, RiskHeatMapEntry, EnterpriseRiskGovernance, RiskGovernanceConfiguration } from "@empireai/pillow";

/** Fallback Enterprise Risk Governance when Pillow session is unavailable. */
export function collectEnterpriseRiskGovernanceSnapshot() {
  const engine = buildFallbackEnterpriseRiskGovernance();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-09",
    live: false,
    enterpriseRiskGovernance: engine,
  };
}

export function getEnterpriseRiskReport() {
  const engine = buildFallbackEnterpriseRiskGovernance();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getEnterpriseRiskRegister(): {
  computedAt: string;
  register: EnterpriseRiskRecord[];
  criticalRisks: EnterpriseRiskGovernance["criticalRisks"];
  heatMap: RiskHeatMapEntry[];
} {
  const engine = buildFallbackEnterpriseRiskGovernance();
  return {
    computedAt: new Date().toISOString(),
    register: engine.enterpriseRiskRegister,
    criticalRisks: engine.criticalRisks,
    heatMap: engine.riskHeatMap,
  };
}

export function getEnterpriseRiskHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getRiskAuditHistory>;
  configuration: RiskGovernanceConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getRiskAuditHistory(100),
    configuration: getRiskConfiguration(),
  };
}

export function getEnterpriseRiskHealth() {
  const engine = buildFallbackEnterpriseRiskGovernance();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    riskHealth: engine.riskHealth,
  };
}

export { assembleEnterpriseRiskGovernance, buildFallbackEnterpriseRiskGovernance };
