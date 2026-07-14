/** P7-05 — Builder Console frontend types (mirrors Pillow PILLOW-BC-001). */

export type BuilderConsoleView = {
  architectureVersion: "P7-05";
  computedAt: string;
  grandKingSummary: string;
  liveExecution: {
    currentMission: string;
    currentRoadmapItem: string;
    currentPhase: string;
    missionPurpose: string;
    missionState: string;
    currentStep: string;
    currentActivity: string;
    overallProgress: number;
    stageProgress: number;
    elapsedTimeMs: number;
    estimatedRemainingTimeMs: number | null;
    executionVelocity: string;
    currentRepository: string;
    currentBranch: string | null;
    filesModified: string[];
    validationStatus: string;
    recoveryStatus: string;
    heartbeatAt: string | null;
    executionHealth: string;
    currentRisks: string[];
    currentWarnings: string[];
  };
  missionTimeline: Array<{
    at: string;
    category: string;
    label: string;
    detail: string;
  }>;
  repositoryActivity: {
    filesCreated: string[];
    filesModified: string[];
    filesDeleted: string[];
    commits: string[];
    branches: string[];
    repositoryHealth: string;
    pendingValidation: string;
    currentFile: string | null;
  };
  validation: {
    architectureReview: string;
    repositoryReview: string;
    testing: string;
    browserTruth: string;
    productionValidation: string;
    grandKingAcceptance: string;
    currentStatus: string;
  };
  recovery: {
    recoveryStatus: string;
    recoveryAttempts: number;
    recoveryHistory: string[];
    currentIncident: string | null;
    currentEscalation: string | null;
    recoveryConfidence: string;
  };
  pillow: {
    recommendations: string[];
    engineeringImprovements: string[];
    architectureImprovements: string[];
    missionImprovements: string[];
    executionWarnings: string[];
  };
  supervisor: {
    executionState: string;
    missionHealth: string;
    progress: string;
    currentRisks: string[];
    eta: string;
    heartbeat: string;
    grandKingSummary: string;
  };
  ecc: {
    missionQueue: string[];
    executionPriority: string;
    dependencyStatus: string;
    resourceAllocation: string;
    coordinationSummary: string;
  };
};

export type BuilderLiveExecution = BuilderConsoleView["liveExecution"];
export type BuilderTimelineEvent = BuilderConsoleView["missionTimeline"][number];
export type BuilderRepositoryActivity = BuilderConsoleView["repositoryActivity"];
export type BuilderValidationPanel = BuilderConsoleView["validation"];
export type BuilderRecoveryPanel = BuilderConsoleView["recovery"];
