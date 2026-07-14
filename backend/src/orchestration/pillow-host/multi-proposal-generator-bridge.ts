import { buildMultiProposalGeneratorConfiguration } from "@empireai/pillow";
import type {
  MultiProposalGeneratorState,
  ProposalGenerationRunReport,
} from "@empireai/pillow";

function buildOfflineMultiProposalGeneratorState(): MultiProposalGeneratorState {
  const configuration = buildMultiProposalGeneratorConfiguration();
  return {
    engineVersion: "PILLOW-MPG-001",
    missionId: "T4-04",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      generatorEnabled: configuration.enabled,
      generationsCompleted: 0,
      lastGenerationAt: null,
      lastGenerationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalProposalsGenerated: 0,
      averageProposalsPerRun: 0,
      uxFindingsLinked: 0,
      builderCapabilitiesLinked: 0,
      averageGenerationDurationMs: 0,
      peakGenerationDurationMs: 0,
    },
  };
}

/** Fallback Multi-Proposal Generator snapshot when Pillow session is unavailable. */
export function collectMultiProposalGeneratorSnapshot() {
  const engine = buildOfflineMultiProposalGeneratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalGenerations: 0,
      totalProposals: 0,
      categoriesCovered: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as ProposalGenerationRunReport | null,
  };
}
