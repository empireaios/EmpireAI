/** Safe offline snapshot; live operations are supplied by the Pillow host. */

export function collectGrandKingAcceptanceGateSnapshot() {

  const configuration = {

    enabled: true,

    executiveReportingEnabled: true,

    neverFabricateApprovalEvidence: true,

    neverBypassGrandKingApproval: true,

    neverAuthoriseWithoutApproval: true,

    neverOverrideFailedCertifications: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ1201OrLater: true,

    preserveCompleteTraceability: true,

    preserveImmutableApprovalHistory: true,

    preserveAuditHistory: true,

    deterministicGateBehaviour: true,

    structuralSignalOnly: true,

    evidenceBasedOnly: true,

    maskSensitiveValues: true,

  };

  return {

    computedAt: new Date().toISOString(),

    missionId: "Q11-10",

    live: false,

    engine: {

      engineVersion: "PILLOW-GKAGT-001",

      missionId: "Q11-10",

      status: "idle",

      initializedAt: new Date().toISOString(),

      configuration,

      latestReport: null,

      engineRecord: null,

      deploymentAuthorisationStatus: "blocked",

      grandKingDecision: "pending",

      reReviewStatus: "not_required",

      health: {

        status: "standby",

        healthScore: 50,

        engineEnabled: true,

        lastOperationAt: null,

        lastValidationDecision: null,

        totalReports: 0,

        lastReportId: null,

        lastGrandKingDecision: null,

        lastDeploymentAuthorisationStatus: null,

        lastConfidenceScore: null,

        notes: ["Pillow session unavailable — offline snapshot"],

      },

    },

    cockpit: {

      missionId: "Q11-10",

      status: "idle",

      healthStatus: "standby",

      totalReports: 0,

      latestReportId: null,

      grandKingDecision: "pending",

      deploymentAuthorisationStatus: "blocked",

      reReviewStatus: "not_required",

      workerId: "wkr-grand-king-acceptance-gate-01",

      grandKingDecisionOptions: ["approve", "reject", "defer", "pending"],

      neverFabricateApprovalEvidence: true,

      neverBypassGrandKingApproval: true,

      neverAuthoriseWithoutApproval: true,

      neverOverrideFailedCertifications: true,

      neverImplementQ1201OrLater: true,

      finalQ11Gate: true,

    },

    catalog: null,

    reports: [],

    q1201Contract: null,

  };

}

