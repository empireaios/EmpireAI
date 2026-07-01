import { apiRequest } from "@/api/client";

export type IntegrationsHubDisplayStatus =
  | "connected"
  | "not_connected"
  | "needs_reauth"
  | "disabled"
  | "error";

export type IntegrationsHubItem = {
  integrationId: string;
  displayName: string;
  category: string;
  purpose: string;
  whyEmpireNeedsIt: string;
  oneTimeSetup: true;
  displayStatus: IntegrationsHubDisplayStatus;
  productionStatus: "production" | "sandbox" | "architecture_only" | "not_configured";
  lastVerification: string | null;
  connectKind: "marketplace" | "reality" | "env" | "future";
  canConnect: boolean;
  canReconnect: boolean;
  future: boolean;
  documentationUrl?: string;
  oarAccessState?: string;
  restrictions: string[];
};

export type IntegrationsHubCategory = {
  category: string;
  label: string;
  integrations: IntegrationsHubItem[];
};

export type IntegrationsHubDashboard = {
  moduleId: string;
  missionId: string;
  doctrineRef: string;
  workspaceId: string;
  categories: IntegrationsHubCategory[];
  summary: {
    total: number;
    connected: number;
    notConnected: number;
    needsReauth: number;
    disabled: number;
    error: number;
  };
  computedAt: string;
};

export async function fetchIntegrationsHubDashboard() {
  return apiRequest<{ dashboard: IntegrationsHubDashboard }>("/integrations-hub/dashboard");
}

export async function connectIntegration(
  integrationId: string,
  credentials?: Record<string, string>,
) {
  return apiRequest<{ ok: boolean; connection?: Record<string, unknown>; state?: Record<string, unknown> }>(
    `/integrations-hub/${integrationId}/connect`,
    {
      method: "POST",
      body: { credentials, credentialType: "api_key" },
    },
  );
}

export function displayStatusLabel(status: IntegrationsHubDisplayStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "not_connected":
      return "Not Connected";
    case "needs_reauth":
      return "Needs Re-authentication";
    case "disabled":
      return "Disabled";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function productionStatusLabel(status: IntegrationsHubItem["productionStatus"]): string {
  switch (status) {
    case "production":
      return "Production";
    case "sandbox":
      return "Sandbox";
    case "architecture_only":
      return "Architecture only";
    case "not_configured":
      return "Not configured";
    default:
      return status;
  }
}
