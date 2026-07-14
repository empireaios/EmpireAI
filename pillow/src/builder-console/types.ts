/** PILLOW-BC-001 — Builder Console types (P7-05). */

export type BuilderConsoleArchitectureVersion = "P7-05";

export type BuilderLiveExecution = {
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

export type BuilderTimelineEvent = {
  at: string;
  category: "mission" | "step" | "recovery" | "validation" | "repository" | "completion";
  label: string;
  detail: string;
};

export type BuilderRepositoryActivity = {
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  commits: string[];
  branches: string[];
  repositoryHealth: string;
  pendingValidation: string;
  currentFile: string | null;
};

export type BuilderValidationPanel = {
  architectureReview: string;
  repositoryReview: string;
  testing: string;
  browserTruth: string;
  productionValidation: string;
  grandKingAcceptance: string;
  currentStatus: string;
};

export type BuilderRecoveryPanel = {
  recoveryStatus: string;
  recoveryAttempts: number;
  recoveryHistory: string[];
  currentIncident: string | null;
  currentEscalation: string | null;
  recoveryConfidence: string;
};

export type BuilderConsoleView = {
  architectureVersion: BuilderConsoleArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  liveExecution: BuilderLiveExecution;
  missionTimeline: BuilderTimelineEvent[];
  repositoryActivity: BuilderRepositoryActivity;
  validation: BuilderValidationPanel;
  recovery: BuilderRecoveryPanel;
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
