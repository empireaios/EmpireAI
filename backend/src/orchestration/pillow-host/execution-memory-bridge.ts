/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectExecutionMemorySnapshot() {
  const configuration = {
    enabled: true,
    recordingRulesEnabled: true,
    neverMakeDecisions: true,
    neverPlanMissions: true,
    neverAssignWorkers: true,
    neverExecuteWork: true,
    neverReplaceKnowledgeSystems: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "Q0-04",
    live: false,
    engine: {
      engineVersion: "PILLOW-EXM-001",
      missionId: "Q0-04",
      status: "idle",
      initializedAt: new Date().toISOString(),
      configuration,
      latestReport: null,
      engineRecord: null,
      health: {
        status: "standby",
        healthScore: 50,
        engineEnabled: true,
        lastOperationAt: null,
        lastValidationDecision: null,
        totalRecords: 0,
        notes: ["Pillow session unavailable — offline snapshot"],
      },
    },
    cockpit: {
      missionId: "Q0-04",
      status: "idle",
      healthStatus: "standby",
      totalRecords: 0,
      neverMakeDecisions: true,
      neverPlanMissions: true,
      neverAssignWorkers: true,
      neverExecuteWork: true,
      neverReplaceKnowledgeSystems: true,
    },
    records: [],
  };
}
