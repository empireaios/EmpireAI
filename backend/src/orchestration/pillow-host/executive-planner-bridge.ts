/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectExecutivePlannerSnapshot() {
  const configuration = {
    enabled: true,
    planningRulesEnabled: true,
    neverExecuteWork: true,
    neverAssignWorkers: true,
    neverInvokeTools: true,
    neverApproveActions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "Q0-01",
    live: false,
    engine: {
      engineVersion: "PILLOW-EP-001",
      missionId: "Q0-01",
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
        totalPlans: 0,
        notes: ["Pillow session unavailable — offline snapshot"],
      },
    },
    cockpit: {
      missionId: "Q0-01",
      status: "idle",
      healthStatus: "standby",
      totalPlans: 0,
      latestPlanId: null,
      neverAssignWorkers: true,
      neverExecuteWork: true,
    },
    latestPlan: null,
    plans: [],
  };
}
