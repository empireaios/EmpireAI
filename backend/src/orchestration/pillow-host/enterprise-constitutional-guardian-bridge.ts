import {
  assembleEnterpriseConstitutionalGuardian,
  buildFallbackEnterpriseConstitutionalGuardian,
  getGuardianConfiguration,
  getGuardianAuditHistory,
} from "@empireai/pillow";
import type {
  EnterpriseConstitutionalGuardian,
  GuardianProtectionEvent,
  ConstitutionalGuardianConfiguration,
} from "@empireai/pillow";

/** Fallback Enterprise Constitutional Guardian when Pillow session is unavailable. */
export function collectEnterpriseConstitutionalGuardianSnapshot() {
  const engine = buildFallbackEnterpriseConstitutionalGuardian();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-13",
    live: false,
    enterpriseConstitutionalGuardian: engine,
  };
}

export function getConstitutionalHealth(): {
  computedAt: string;
  constitutionHealthScore: number;
  constitutionHealth: string;
  constitutionHealthEntries: EnterpriseConstitutionalGuardian["constitutionHealthEntries"];
  protectedAssets: EnterpriseConstitutionalGuardian["protectedAssets"];
} {
  const engine = buildFallbackEnterpriseConstitutionalGuardian();
  return {
    computedAt: new Date().toISOString(),
    constitutionHealthScore: engine.constitutionHealthScore,
    constitutionHealth: engine.constitutionHealth,
    constitutionHealthEntries: engine.constitutionHealthEntries,
    protectedAssets: engine.protectedAssets,
  };
}

export function getConstitutionalGuardianReport() {
  const engine = buildFallbackEnterpriseConstitutionalGuardian();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getConstitutionalViolations(): {
  computedAt: string;
  violations: EnterpriseConstitutionalGuardian["constitutionViolations"];
  protectionEvents: EnterpriseConstitutionalGuardian["protectionEvents"];
  register: GuardianProtectionEvent[];
} {
  const engine = buildFallbackEnterpriseConstitutionalGuardian();
  return {
    computedAt: new Date().toISOString(),
    violations: engine.constitutionViolations,
    protectionEvents: engine.protectionEvents,
    register: engine.guardianProtectionRegister,
  };
}

export function getConstitutionalGuardianHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getGuardianAuditHistory>;
  configuration: ConstitutionalGuardianConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getGuardianAuditHistory(100),
    configuration: getGuardianConfiguration(),
  };
}

export function getConstitutionalGuardianHealth() {
  const engine = buildFallbackEnterpriseConstitutionalGuardian();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    constitutionHealth: engine.constitutionHealth,
  };
}

export { assembleEnterpriseConstitutionalGuardian, buildFallbackEnterpriseConstitutionalGuardian };
