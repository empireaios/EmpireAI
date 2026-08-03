/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectGlobalOperationsCertifiedSnapshot() {
  const configuration = {
    enabled: true,
    certificationScope: ["X4-01…X4-18"],
    safeTestMode: true,
    neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
  return {
    computedAt: new Date().toISOString(), missionId: "X4-19", live: false,
    engine: { engineVersion: "PILLOW-GOC-001", missionId: "X4-19", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null, health: { status: "standby", healthScore: 50, notes: ["Pillow session unavailable — offline snapshot"] } },
    cockpit: { engineStatus: "idle", healthStatus: "standby", overallGlobalReadinessScore: 50, totalCertificationReports: 0, recentLogs: [] },
    latestReport: null, certificationReports: [],
  };
}
