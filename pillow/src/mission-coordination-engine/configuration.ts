import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MISSION_PHASES, MISSION_STATES } from "./paths.js";
import type { MissionRecord } from "./types.js";

export type MissionCoordinationEngineConfiguration = {
  enabled: boolean;
  planningRulesEnabled: boolean;
  phaseRulesEnabled: boolean;
  dependencyRulesEnabled: boolean;
  approvalRulesEnabled: boolean;
  stallDetectionEnabled: boolean;
  blockageDetectionEnabled: boolean;
  closureRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  missionStates: string[];
  missionPhases: string[];
  stallThresholdMs: number;
  seedMissions: MissionRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-25 hard boundaries — force-locked true. */
  neverExecuteWorkerLogic: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceExecutivePlanner: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveMissionTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_MISSIONS: MissionRecord[] = [];

export const DEFAULT_MISSION_COORDINATION_ENGINE_CONFIGURATION: MissionCoordinationEngineConfiguration =
  {
    enabled: true,
    planningRulesEnabled: true,
    phaseRulesEnabled: true,
    dependencyRulesEnabled: true,
    approvalRulesEnabled: true,
    stallDetectionEnabled: true,
    blockageDetectionEnabled: true,
    closureRulesEnabled: true,
    validationRulesEnabled: true,
    missionStates: [...MISSION_STATES],
    missionPhases: [...MISSION_PHASES],
    stallThresholdMs: 60_000,
    seedMissions: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerLogic: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplaceExecutivePlanner: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveMissionTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildMissionCoordinationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MissionCoordinationEngineConfiguration> = {},
): MissionCoordinationEngineConfiguration {
  let file: Partial<MissionCoordinationEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "mission-coordination-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MISSION_COORDINATION_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.MISSION_COORDINATION_ENGINE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedStates = Array.from(
    new Set([
      ...DEFAULT_MISSION_COORDINATION_ENGINE_CONFIGURATION.missionStates,
      ...(file.missionStates ?? []),
      ...(overrides.missionStates ?? []),
    ]),
  );
  const mergedPhases = Array.from(
    new Set([
      ...DEFAULT_MISSION_COORDINATION_ENGINE_CONFIGURATION.missionPhases,
      ...(file.missionPhases ?? []),
      ...(overrides.missionPhases ?? []),
    ]),
  );

  return {
    ...DEFAULT_MISSION_COORDINATION_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    missionStates: mergedStates,
    missionPhases: mergedPhases,
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? []).map((r) => ({
      ...r,
      assignedWorkers: [...r.assignedWorkers],
      blockers: [...r.blockers],
      phaseHistory: [...r.phaseHistory],
      dependencies: r.dependencies.map((d) => ({
        ...d,
        dependsOn: [...d.dependsOn],
      })),
      approvalCheckpoints: r.approvalCheckpoints.map((c) => ({ ...c })),
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerLogic: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplaceExecutivePlanner: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveMissionTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
