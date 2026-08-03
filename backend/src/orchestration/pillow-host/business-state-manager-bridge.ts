/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectBusinessStateManagerSnapshot() {
  const configuration = {
    enabled: true,
    registryRulesEnabled: true,
    neverExecuteMissions: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverLaunchBusinesses: true,
    neverMakeStrategicDecisions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "Q0-03",
    live: false,
    engine: {
      engineVersion: "PILLOW-BSM-001",
      missionId: "Q0-03",
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
        totalBusinesses: 0,
        activeBusinessCount: 0,
        notes: ["Pillow session unavailable — offline snapshot"],
      },
    },
    cockpit: {
      missionId: "Q0-03",
      status: "idle",
      healthStatus: "standby",
      totalBusinesses: 0,
      activeBusinessCount: 0,
      neverExecuteMissions: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverLaunchBusinesses: true,
      neverMakeStrategicDecisions: true,
    },
    businesses: [],
  };
}
