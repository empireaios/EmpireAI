/**
 * G8-05 — Authorization Centre Cockpit types.
 */

import type { ConnectionHealthState } from "../../connection-health-monitoring/contracts/connection-health-types.js";

export const AUTHORIZATION_CENTRE_VERSION = "g8-05-v1" as const;
export const AUTHORIZATION_CENTRE_SCREEN_ID = "SCR-304" as const;
export const AUTHORIZATION_CENTRE_ROUTE = "/cockpit/operations/authorizations" as const;

export type AuthorizationCentreAction =
  | "start_authorization"
  | "submit_credential"
  | "reconnect"
  | "cancel_authorization"
  | "run_health_check"
  | "refresh_status"
  | "view_requirements"
  | "view_credential_references"
  | "view_ekls_events";

export type AuthorizationProviderCard = {
  providerId: string;
  providerName: string;
  providerCategory: string;
  connectionStatus: string;
  authorizationStatus: string;
  credentialStatus: string;
  healthStatus: ConnectionHealthState | string;
  readinessStatus: string;
  expiry: string | null;
  requiredAction: string | null;
  accountHolderId: string;
  accountHolderType: string;
  environment: "sandbox" | "production";
  lastVerified: string | null;
  primaryAction: "connect" | "reconnect" | "review" | "none";
};

export type AuthorizationCentreOverview = {
  overallReadinessPercent: number;
  connectedProviders: number;
  disconnectedProviders: number;
  expiredAuthorizations: number;
  missingCredentials: number;
  missingPermissions: number;
  reconnectRequired: number;
};

export type AuthorizationCentreEklsReference = {
  referenceId: string;
  kind: string;
  summary: string;
  recordedAt: string;
  channel: string;
};

export type AuthorizationCentreRecentActivity = {
  activityId: string;
  kind: string;
  providerId?: string;
  summary: string;
  recordedAt: string;
};

export type AuthorizationCentreView = {
  computedAt: string;
  workspaceId: string;
  screenId: typeof AUTHORIZATION_CENTRE_SCREEN_ID;
  route: typeof AUTHORIZATION_CENTRE_ROUTE;
  dataMode: "identity-authorization";
  overview: AuthorizationCentreOverview;
  providerCards: AuthorizationProviderCard[];
  providerMatrix: Array<{
    providerId: string;
    displayName: string;
    status: string;
    severity: string;
    checkCount: number;
    lastCheckedAt: string | null;
  }>;
  attentionItems: Array<{
    attentionId: string;
    providerId: string;
    status: string;
    severity: string;
    message: string;
    requiredAction: string | null;
  }>;
  accountHolderGroups: Array<{
    accountHolderTypeId: string;
    accountHolderTypeName: string;
    connectionCount: number;
    providerIds: string[];
  }>;
  grandKingConnections: string[];
  futureCustomerConnections: string[];
  recentActivity: AuthorizationCentreRecentActivity[];
  eklsReferenceCount: number;
  pillowGovernanceState: "pillow-governed";
  pluginWidgets: Array<{ pluginId: string; title: string; summary: string }>;
  brainModule: "identity-authorization";
  readinessSummary?: {
    overallReadinessScore: number;
    overallReadinessLevel: string;
    blockedActions: string[];
    nextRequiredAction: string;
    providerReadinessCount: number;
    correlationId: string;
  };
  tokenLifecycleSummary?: {
    expiringSoonCount: number;
    expiredCount: number;
    reconnectRequiredCount: number;
    reauthorizationPendingCount: number;
    requiredAccountHolderAction: string;
  };
  isolationSummary?: {
    viewerScope: string;
    visibleProviderCount: number;
    hiddenProviderCount: number;
    isolationEnforced: true;
    requiredAccountHolderAction: string;
  };
  pluginIntegrationSummary?: {
    installedPluginCount: number;
    enabledPluginCount: number;
    failedPluginCount: number;
    providerCoverageCount: number;
    capabilityCount: number;
    warningCount: number;
    errorCount: number;
    correlationId: string;
  };
};

export type AuthorizationProviderDetailView = {
  computedAt: string;
  workspaceId: string;
  providerId: string;
  providerName: string;
  connectionSummary: {
    connectionId: string;
    connectionStatus: string;
    authorizationStatus: string;
    credentialStatus: string;
    healthStatus: string;
    readinessStatus: string;
    environment: string;
    accountHolderId: string;
    expiry: string | null;
    lastVerified: string | null;
  };
  requiredScopes: string[];
  grantedScopes: string[];
  missingScopes: string[];
  requiredPermissions: string[];
  grantedPermissions: string[];
  missingPermissions: string[];
  credentialReferences: Array<{
    credentialRefId: string;
    credentialType: string;
    status: string;
    vaultBackend: string;
    expiresAt: string | null;
    lastVerifiedAt: string | null;
  }>;
  healthChecks: Array<{
    healthCheckId: string;
    checkType: string;
    status: string;
    severity: string;
    message: string;
    lastCheckedAt: string;
  }>;
  readinessResult: {
    readinessPercent: number;
    overallStatus: string;
  };
  eklsEvents: AuthorizationCentreEklsReference[];
  brainActions: AuthorizationCentreAction[];
  pillowGovernanceState: "pillow-governed";
  governanceChecks: {
    workspaceOwnership: boolean;
    providerEligibility: boolean;
    monitoringPermission: boolean;
    credentialVisibilityBoundary: boolean;
  };
};
