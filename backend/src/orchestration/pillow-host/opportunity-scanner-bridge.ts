/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectOpportunityScannerSnapshot() {
  const configuration = {
    enabled: true,
    opportunityDomains: ["market_expansion", "cost_efficiency"],
    neverExecuteOpportunities: true,
    neverApproveOpportunities: true,
    neverAssignWorkers: true,
    neverCreateBusinesses: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "Q0-02",
    live: false,
    engine: {
      engineVersion: "PILLOW-OSC-001",
      missionId: "Q0-02",
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
        totalOpportunities: 0,
        pendingReviewCount: 0,
        notes: ["Pillow session unavailable — offline snapshot"],
      },
    },
    cockpit: {
      missionId: "Q0-02",
      status: "idle",
      healthStatus: "standby",
      totalOpportunities: 0,
      pendingReviewCount: 0,
      configuredDomains: [],
      neverExecuteOpportunities: true,
      neverApproveOpportunities: true,
      neverAssignWorkers: true,
      neverCreateBusinesses: true,
    },
    opportunities: [],
    pendingReview: [],
  };
}
