/** P7-06 — Live ETA Experience frontend types (mirrors Pillow PILLOW-LE-001). */

export type LiveEtaExperience = {
  architectureVersion: "P7-06";
  computedAt: string;
  grandKingSummary: string;
  currentMission: string;
  missionCountdown: {
    remainingTimeMs: number;
    predictedCompletionAt: string;
    progressPercent: number;
    completedWork: string;
    remainingWork: string;
    currentStage: string;
    currentStep: string;
    elapsedTimeMs: number;
  };
  supervisorTimer: {
    missionTimer: string;
    elapsedTimeMs: number;
    remainingTimeMs: number;
    currentPhase: string;
    currentStage: string;
    currentStep: string;
    heartbeat: string;
    executionVelocity: string;
    recoveryDelay: string;
    validationDelay: string;
    missionHealth: string;
  };
  builderCountdown: {
    currentActivity: string;
    currentFile: string | null;
    repositoryActivity: string;
    completedTasks: string;
    remainingTasks: string;
    currentProgress: number;
    estimatedRemainingWork: string;
    currentQueue: string | null;
    currentWorker: string;
  };
  confidence: {
    confidencePercent: number;
    confidenceClassification: string;
    reason: string;
    evidence: string[];
    knownUncertainty: string[];
  };
  execution: {
    executionVelocity: number;
    velocityLabel: string;
    currentDelay: string | null;
    currentBottleneck: string | null;
    criticalPath: string[];
    lastUpdateAt: string;
    updateTrigger: string;
  };
  pillow: {
    etaAccuracy: string[];
    predictionQuality: string;
    executionTrends: string[];
    historicalComparisons: string[];
    delayPatterns: string[];
    improvementOpportunities: string[];
    recommendations: string[];
  };
};
