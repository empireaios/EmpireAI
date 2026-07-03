/** PILLOW-IC-001 — Infrastructure Commander types (Phase 6). */

export type PlatformId = "github" | "railway" | "vercel" | "application";

export type HealthStatus = "healthy" | "degraded" | "critical" | "unknown";

export type AlertLevel = "none" | "informational" | "executive_attention" | "critical";

export interface GitHubOrchestrationSnapshot {
  platform: "github";
  available: boolean;
  repository: string | null;
  branch: string | null;
  syncStatus: "synced" | "ahead" | "behind" | "diverged" | "unknown";
  uncommittedChanges: number;
  recentCommits: string[];
  openPullRequests: string[];
  releaseReadiness: HealthStatus;
  health: HealthStatus;
  findings: string[];
}

export interface RailwayOrchestrationSnapshot {
  platform: "railway";
  serviceUrl: string;
  healthEndpoint: HealthStatus;
  brainOnline: boolean;
  pillowHealth: HealthStatus;
  responseMs: number | null;
  deploymentNotes: string[];
  restartStrategy: string;
  rollbackPlan: string;
  health: HealthStatus;
  findings: string[];
}

export interface VercelOrchestrationSnapshot {
  platform: "vercel";
  productionUrl: string;
  frontendReachable: boolean;
  bffHealth: HealthStatus;
  pillowProxyOk: boolean;
  routingNotes: string[];
  buildValidation: HealthStatus;
  health: HealthStatus;
  findings: string[];
}

export interface ApplicationHealthSnapshot {
  platform: "application";
  endpoints: Array<{ path: string; status: number | null; ok: boolean }>;
  certificateOk: boolean;
  serviceAvailability: HealthStatus;
  health: HealthStatus;
  findings: string[];
}

export interface InfrastructureMonitorSnapshot {
  monitoredAt: string;
  overallHealth: HealthStatus;
  productionReadiness: HealthStatus;
  alertLevel: AlertLevel;
  github: GitHubOrchestrationSnapshot;
  railway: RailwayOrchestrationSnapshot;
  vercel: VercelOrchestrationSnapshot;
  application: ApplicationHealthSnapshot;
  activeRisks: string[];
  executiveAttentionRequired: boolean;
}

export interface RecoveryCoordinationPlan {
  issue: string;
  category: "build" | "deployment" | "runtime" | "degradation" | "repository";
  severity: HealthStatus;
  automatedSteps: string[];
  manualSteps: string[];
  rollbackSteps: string[];
  estimatedRecovery: string;
}

export interface ExecutiveInfrastructureReport {
  version: "PILLOW-IC-001";
  generatedAt: string;
  overallHealth: HealthStatus;
  productionReadiness: HealthStatus;
  alertLevel: AlertLevel;
  summary: string;
  githubSummary: string;
  railwaySummary: string;
  vercelSummary: string;
  applicationSummary: string;
  activeDeployments: string[];
  currentRisks: string[];
  recommendedActions: string[];
  recoveryStatus: string;
  executiveBrief: string;
}

export interface InfrastructureCommanderState {
  commanderVersion: "PILLOW-IC-001";
  status: "ready";
  initializedAt: string;
  totalScans: number;
  lastScanAt: string | null;
  platformsMonitored: PlatformId[];
}
