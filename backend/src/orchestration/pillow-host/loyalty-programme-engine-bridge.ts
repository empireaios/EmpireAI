import { buildLoyaltyProgrammeEngineConfiguration } from "@empireai/pillow";
import type { LoyaltyProgrammeEngineState, LoyaltyRunReport } from "@empireai/pillow";

function buildOfflineLoyaltyProgrammeEngineState(): LoyaltyProgrammeEngineState {
  const configuration = buildLoyaltyProgrammeEngineConfiguration();
  return {
    engineVersion: "PILLOW-LPE-001",
    missionId: "R4-12",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalProgrammes: 0,
      totalMembers: 0,
      totalLoyaltyRecords: 0,
      totalPointsAwarded: 0,
      totalPointsRedeemed: 0,
      activeAbuseAlerts: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      programmesCreated: 0,
      membersRegistered: 0,
      pointsAwarded: 0,
      pointsRedeemed: 0,
      tiersUpdated: 0,
      rewardsGenerated: 0,
      abuseDetected: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Loyalty Programme Engine snapshot when Pillow session is unavailable. */
export function collectLoyaltyProgrammeEngineSnapshot() {
  const engine = buildOfflineLoyaltyProgrammeEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalProgrammes: 0,
      totalMembers: 0,
      totalLoyaltyRecords: 0,
      activeAbuseAlerts: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as LoyaltyRunReport | null,
    loyaltyRecords: [],
    programmes: [],
    members: [],
    rewards: [],
    abuseAlerts: [],
  };
}
