import { apiRequest } from "@/api/client";

export async function fetchMarketplaceConnections() {
  return apiRequest<{ connections: Record<string, unknown>[] }>(
    "/marketplace-infrastructure/connections",
  );
}

export async function fetchRealityIntegrationDashboard(companyId: string) {
  return apiRequest<Record<string, unknown>>("/reality-integration/dashboard", {
    params: { companyId },
  });
}

export async function fetchRealityProviders() {
  return apiRequest<{ providers: Record<string, unknown>[] }>("/reality-integration/registry");
}

export async function connectRealityProvider(providerId: string, credentials: Record<string, string>) {
  return apiRequest<Record<string, unknown>>("/reality-integration/connect", {
    method: "POST",
    body: { providerId, credentials },
  });
}

export async function startMarketplaceConnection(marketplaceId: string) {
  return apiRequest<{ connection: Record<string, unknown> }>(
    `/marketplace-infrastructure/${marketplaceId}/connect`,
    { method: "POST" },
  );
}
