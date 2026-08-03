import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NEGOTIATION_OUTCOMES } from "./paths.js";
import type { NegotiationRecord } from "./types.js";

export type TaskNegotiationProtocolConfiguration = {
  enabled: boolean;
  negotiationRulesEnabled: boolean;
  conflictRulesEnabled: boolean;
  escalationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  negotiationOutcomes: string[];
  minCapabilityScore: number;
  sharedOwnershipThreshold: number;
  escalateOnTie: boolean;
  seedNegotiations: NegotiationRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-20 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveNegotiationTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_NEGOTIATIONS: NegotiationRecord[] = [];

export const DEFAULT_TASK_NEGOTIATION_PROTOCOL_CONFIGURATION: TaskNegotiationProtocolConfiguration =
  {
    enabled: true,
    negotiationRulesEnabled: true,
    conflictRulesEnabled: true,
    escalationRulesEnabled: true,
    validationRulesEnabled: true,
    negotiationOutcomes: [...NEGOTIATION_OUTCOMES],
    minCapabilityScore: 50,
    sharedOwnershipThreshold: 5,
    escalateOnTie: true,
    seedNegotiations: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplacePillow: true,
    neverOverrideGrandKing: true,
    neverPerformStrategicPlanning: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveNegotiationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildTaskNegotiationProtocolConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TaskNegotiationProtocolConfiguration> = {},
): TaskNegotiationProtocolConfiguration {
  let file: Partial<TaskNegotiationProtocolConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "task-negotiation-protocol.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.TASK_NEGOTIATION_PROTOCOL_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.TASK_NEGOTIATION_PROTOCOL_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedOutcomes = Array.from(
    new Set([
      ...DEFAULT_TASK_NEGOTIATION_PROTOCOL_CONFIGURATION.negotiationOutcomes,
      ...(file.negotiationOutcomes ?? []),
      ...(overrides.negotiationOutcomes ?? []),
    ]),
  );

  return {
    ...DEFAULT_TASK_NEGOTIATION_PROTOCOL_CONFIGURATION,
    ...file,
    ...overrides,
    negotiationOutcomes: mergedOutcomes,
    seedNegotiations: (overrides.seedNegotiations ?? file.seedNegotiations ?? []).map((r) => ({
      ...r,
      candidateWorkers: [...r.candidateWorkers],
      capabilityAssessment: r.capabilityAssessment.map((c) => ({
        ...c,
        declaredCapabilities: [...c.declaredCapabilities],
      })),
      ownershipDecision: { ...r.ownershipDecision },
      supportingWorkers: [...r.supportingWorkers],
      dependencyGraph: r.dependencyGraph.map((d) => ({ ...d })),
      handoffs: r.handoffs.map((h) => ({ ...h })),
      conflicts: [...r.conflicts],
      requiredCapabilities: [...r.requiredCapabilities],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplacePillow: true,
    neverOverrideGrandKing: true,
    neverPerformStrategicPlanning: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveNegotiationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
