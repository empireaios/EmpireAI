/** REAL-002B — Live Commerce Integration configuration. */

export type LiveCommerceIntegrationMode = "disabled" | "sandbox" | "production";

export function isLiveCommerceIntegrationEnabled(): boolean {
  return resolveLiveCommerceIntegrationMode() !== "disabled";
}

export function resolveLiveCommerceIntegrationMode(): LiveCommerceIntegrationMode {
  const raw = (process.env.LIVE_COMMERCE_INTEGRATION_MODE ?? "sandbox").toLowerCase();
  if (raw === "disabled" || raw === "off" || raw === "false") return "disabled";
  if (raw === "production" || raw === "live") return "production";
  return "sandbox";
}

export function isProductionLiveCommerce(): boolean {
  return resolveLiveCommerceIntegrationMode() === "production";
}

export const LIVE_COMMERCE_PROVIDER_IDS = {
  marketplaces: ["amazon-seller"] as const,
  suppliers: ["cj-dropshipping"] as const,
};

export function getAmazonSpApiConfig() {
  return {
    clientId: process.env.AMAZON_SP_API_CLIENT_ID ?? "",
    clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET ?? "",
    refreshToken: process.env.AMAZON_SP_API_REFRESH_TOKEN ?? "",
    region: process.env.AMAZON_SP_API_REGION ?? "na",
    sandboxEndpoint:
      process.env.AMAZON_SP_API_SANDBOX_ENDPOINT ??
      "https://sandbox.sellingpartnerapi-na.amazon.com",
    productionEndpoint:
      process.env.AMAZON_SP_API_ENDPOINT ??
      "https://sellingpartnerapi-na.amazon.com",
  };
}

export function getSupplierApiConfig(providerId: string) {
  if (providerId === "cj-dropshipping") {
    return {
      apiKey: process.env.CJ_DROPSHIPPING_API_KEY ?? "",
      baseUrl:
        process.env.CJ_DROPSHIPPING_API_BASE ??
        "https://developers.cjdropshipping.com/api2.0/v1",
    };
  }
  return { apiKey: "", baseUrl: "" };
}
