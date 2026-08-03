/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectEmpireCertifiedSnapshot() {
  const configuration = {
    enabled: true,
    certificationScope: ["X5-01…X5-19"],
    programmeScope: ["X1", "X2", "X3", "X4", "X5"],
    safeTestMode: true,
    neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-20",
    live: false,
    engine: {
      engineVersion: "PILLOW-EC-001",
      missionId: "X5-20",
      status: "idle",
      initializedAt: new Date().toISOString(),
      configuration,
      latestReport: null,
      engineRecord: null,
      health: {
        status: "standby",
        healthScore: 50,
        notes: ["Pillow session unavailable — offline snapshot"],
      },
    },
    cockpit: {
      engineStatus: "idle",
      healthStatus: "standby",
      overallReadinessScore: 50,
      totalCertificationReports: 0,
      recentLogs: [],
    },
    latestReport: null,
    certificationReports: [],
  };
}
