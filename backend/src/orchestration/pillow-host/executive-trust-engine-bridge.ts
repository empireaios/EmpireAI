import {
  assembleExecutiveTrustEngine,
  buildFallbackExecutiveTrustEngine,
  getTrustConfiguration,
  getTrustAuditHistory,
} from "@empireai/pillow";
import type {
  ExecutiveTrustEngine,
  TrustAssessmentRecord,
  TrustEngineConfiguration,
} from "@empireai/pillow";

/** Fallback Executive Trust Engine when Pillow session is unavailable. */
export function collectExecutiveTrustEngineSnapshot() {
  const engine = buildFallbackExecutiveTrustEngine();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-12",
    live: false,
    executiveTrustEngine: engine,
  };
}

export function getExecutiveTrustScores(): {
  computedAt: string;
  executiveTrustScore: number;
  governanceTrustScore: number;
  decisionConfidence: number;
  executiveTrustScores: ExecutiveTrustEngine["executiveTrustScores"];
  governanceTrustScores: ExecutiveTrustEngine["governanceTrustScores"];
} {
  const engine = buildFallbackExecutiveTrustEngine();
  return {
    computedAt: new Date().toISOString(),
    executiveTrustScore: engine.executiveTrustScore,
    governanceTrustScore: engine.governanceTrustScore,
    decisionConfidence: engine.decisionConfidence,
    executiveTrustScores: engine.executiveTrustScores,
    governanceTrustScores: engine.governanceTrustScores,
  };
}

export function getExecutiveTrustReport() {
  const engine = buildFallbackExecutiveTrustEngine();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getExecutiveTrustRegister(): {
  computedAt: string;
  register: TrustAssessmentRecord[];
  trends: ExecutiveTrustEngine["trustTrends"];
  confidenceAnalysis: ExecutiveTrustEngine["confidenceAnalysis"];
} {
  const engine = buildFallbackExecutiveTrustEngine();
  return {
    computedAt: new Date().toISOString(),
    register: engine.trustAssessmentRegister,
    trends: engine.trustTrends,
    confidenceAnalysis: engine.confidenceAnalysis,
  };
}

export function getExecutiveTrustHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getTrustAuditHistory>;
  trustHistory: ExecutiveTrustEngine["trustHistory"];
  configuration: TrustEngineConfiguration;
} {
  const engine = buildFallbackExecutiveTrustEngine();
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getTrustAuditHistory(100),
    trustHistory: engine.trustHistory,
    configuration: getTrustConfiguration(),
  };
}

export function getExecutiveTrustHealth() {
  const engine = buildFallbackExecutiveTrustEngine();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    trustHealth: engine.trustHealth,
  };
}

export { assembleExecutiveTrustEngine, buildFallbackExecutiveTrustEngine };
