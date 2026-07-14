import {
  assembleExecutivePolicyEvolution,
  buildFallbackExecutivePolicyEvolution,
  getPolicyEvolutionConfiguration,
  getPolicyEvolutionAuditHistory,
} from "@empireai/pillow";
import type {
  ExecutivePolicyEvolution,
  PolicyEvolutionRecord,
  PolicyEvolutionConfiguration,
} from "@empireai/pillow";

/** Fallback Executive Policy Evolution when Pillow session is unavailable. */
export function collectExecutivePolicyEvolutionSnapshot() {
  const engine = buildFallbackExecutivePolicyEvolution();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-11",
    live: false,
    executivePolicyEvolution: engine,
  };
}

export function getPolicyEvolutionQueue(): {
  computedAt: string;
  queue: ExecutivePolicyEvolution["evolutionQueue"];
  versions: ExecutivePolicyEvolution["policyVersions"];
} {
  const engine = buildFallbackExecutivePolicyEvolution();
  return {
    computedAt: new Date().toISOString(),
    queue: engine.evolutionQueue,
    versions: engine.policyVersions,
  };
}

export function getPolicyEvolutionReport() {
  const engine = buildFallbackExecutivePolicyEvolution();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getPolicyEvolutionRegister(): {
  computedAt: string;
  register: PolicyEvolutionRecord[];
  opportunities: ExecutivePolicyEvolution["improvementOpportunities"];
  effectiveness: ExecutivePolicyEvolution["policyEffectiveness"];
} {
  const engine = buildFallbackExecutivePolicyEvolution();
  return {
    computedAt: new Date().toISOString(),
    register: engine.policyEvolutionRegister,
    opportunities: engine.improvementOpportunities,
    effectiveness: engine.policyEffectiveness,
  };
}

export function getPolicyEvolutionHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getPolicyEvolutionAuditHistory>;
  configuration: PolicyEvolutionConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getPolicyEvolutionAuditHistory(100),
    configuration: getPolicyEvolutionConfiguration(),
  };
}

export function getPolicyEvolutionHealth() {
  const engine = buildFallbackExecutivePolicyEvolution();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    evolutionHealth: engine.evolutionHealth,
  };
}

export { assembleExecutivePolicyEvolution, buildFallbackExecutivePolicyEvolution };
