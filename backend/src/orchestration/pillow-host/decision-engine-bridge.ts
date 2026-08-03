/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectDecisionEngineSnapshot() {
  const configuration = {
    enabled: true,
    evaluationRulesEnabled: true,
    neverExecuteWork: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverOverridePillow: true,
    neverReplaceGrandKingApproval: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "Q0-05",
    live: false,
    engine: {
      engineVersion: "PILLOW-DE-001",
      missionId: "Q0-05",
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
        totalDecisions: 0,
        notes: ["Pillow session unavailable — offline snapshot"],
      },
    },
    cockpit: {
      missionId: "Q0-05",
      status: "idle",
      healthStatus: "standby",
      totalDecisions: 0,
      latestDecisionId: null,
      neverExecuteWork: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverOverridePillow: true,
      neverReplaceGrandKingApproval: true,
    },
    latestPackage: null,
    packages: [],
  };
}
