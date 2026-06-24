/** Shared Eye types — vendor-agnostic observation plane. */

export type EyeProviderId = string;

export type EyeSignalDomain =
  | "product"
  | "trend"
  | "supplier"
  | "advertisement"
  | "market"
  | "risk";

export type EyeConnectorStatus =
  | "registered"
  | "connected"
  | "active"
  | "degraded"
  | "paused"
  | "disconnected";

export type EyeObservationMode = "poll" | "push" | "both";

export type EyeHealthState = "healthy" | "degraded" | "unhealthy" | "unknown";

export type EyeConnectorContext = {
  workspaceId: string;
  correlationId: string;
  credentialsRef?: string;
  region?: string;
};

export type EyeObserveRequest = {
  domain: EyeSignalDomain;
  query: Record<string, unknown>;
  mode?: "live" | "cached";
};

/** Raw observation before pipeline normalization. */
export type EyeRawObservation = {
  observationId: string;
  providerId: EyeProviderId;
  domain: EyeSignalDomain;
  payload: Record<string, unknown>;
  fetchedAt: string;
  mock: boolean;
  sourceRef?: string;
};

export type EyeConnectorHealth = {
  status: EyeConnectorStatus;
  healthState: EyeHealthState;
  message: string;
  latencyMs?: number;
  lastSuccessfulPollAt?: string;
  lastFailedPollAt?: string;
  checkedAt: string;
};

export type EyeConnectorDefinition = {
  providerId: EyeProviderId;
  providerName: string;
  supportedDomains: readonly EyeSignalDomain[];
  observationMode: EyeObservationMode;
  defaultPollIntervalSec: number;
  rateLimitPerMinute: number;
  replacesOperationalId?: string;
};

export type EyePollSchedule = {
  id: string;
  workspaceId: string;
  providerId: EyeProviderId;
  domain: EyeSignalDomain;
  intervalSec: number;
  cronExpression?: string;
  queryTemplate: Record<string, unknown>;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
};

export type EyeConnectorStateRecord = {
  workspaceId: string;
  providerId: EyeProviderId;
  status: EyeConnectorStatus;
  healthState: EyeHealthState;
  credentialsRef: string | null;
  lastPollAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
  metadata: Record<string, unknown>;
  updatedAt: string;
};
