/** PILLOW-LE-001 — Live ETA Experience types (P7-06). */

export type LiveEtaArchitectureVersion = "P7-06";

export type LiveEtaMissionCountdown = {
  remainingTimeMs: number;
  predictedCompletionAt: string;
  progressPercent: number;
  completedWork: string;
  remainingWork: string;
  currentStage: string;
  currentStep: string;
  elapsedTimeMs: number;
};

export type LiveEtaSupervisorTimer = {
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

export type LiveEtaBuilderCountdown = {
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

export type LiveEtaConfidence = {
  confidencePercent: number;
  confidenceClassification: string;
  reason: string;
  evidence: string[];
  knownUncertainty: string[];
};

export type LiveEtaExecution = {
  executionVelocity: number;
  velocityLabel: string;
  currentDelay: string | null;
  currentBottleneck: string | null;
  criticalPath: string[];
  lastUpdateAt: string;
  updateTrigger: string;
};

export type LiveEtaPillowAnalysis = {
  etaAccuracy: string[];
  predictionQuality: string;
  executionTrends: string[];
  historicalComparisons: string[];
  delayPatterns: string[];
  improvementOpportunities: string[];
  recommendations: string[];
};

export type LiveEtaExperience = {
  architectureVersion: LiveEtaArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  currentMission: string;
  missionCountdown: LiveEtaMissionCountdown;
  supervisorTimer: LiveEtaSupervisorTimer;
  builderCountdown: LiveEtaBuilderCountdown;
  confidence: LiveEtaConfidence;
  execution: LiveEtaExecution;
  pillow: LiveEtaPillowAnalysis;
};
