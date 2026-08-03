/** Safe offline snapshot; live operations are supplied by the Pillow host. */
export function collectFrontendWorkerSnapshot() {
  const configuration = {
    enabled: true, frontendRulesEnabled: true, validationRulesEnabled: true, executiveReportingEnabled: true,
    neverImplementBackendBusinessLogic: true, neverDesignDatabases: true, neverDeployApplications: true,
    neverOverridePillow: true, neverOverrideGrandKing: true, neverImplementQ605OrLater: true,
    followApprovedRequirementsAndArchitecture: true, preserveCompleteTraceability: true,
    buildReusableComponents: true, validateAccessibilityAndResponsiveness: true, preserveAuditHistory: true,
    structuralSignalOnly: true, maskSensitiveValues: true,
  };
  return {
    computedAt: new Date().toISOString(), missionId: "Q6-04", live: false,
    engine: { engineVersion: "PILLOW-FEW-001", missionId: "Q6-04", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null, health: { status: "standby", healthScore: 50, engineEnabled: true, lastOperationAt: null, lastValidationDecision: null, totalFrontendBuildReports: 0, lastFrontendBuildReportId: null, lastConfidenceScore: null, notes: ["Pillow session unavailable — offline snapshot"] } },
    cockpit: { missionId: "Q6-04", status: "idle", healthStatus: "standby", totalFrontendBuildReports: 0, latestFrontendBuildReportId: null, neverImplementBackendBusinessLogic: true, neverDesignDatabases: true, neverDeployApplications: true, neverImplementQ605OrLater: true },
    catalog: null, frontendBuildReports: [],
  };
}
