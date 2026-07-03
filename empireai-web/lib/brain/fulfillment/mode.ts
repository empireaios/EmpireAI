/** REAL-129 / REAL-130 — Fulfillment integration mode for Cockpit operations. */
export type FulfillmentIntegrationMode = "sandbox" | "production";

export function getFulfillmentIntegrationMode(): FulfillmentIntegrationMode {
  if (typeof process !== "undefined") {
    const mode = process.env.NEXT_PUBLIC_LIVE_COMMERCE_INTEGRATION_MODE;
    if (mode === "production") return "production";
  }
  if (typeof window !== "undefined") {
    const mode = (window as Window & { __EMPIRE_LIVE_COMMERCE_MODE?: string }).__EMPIRE_LIVE_COMMERCE_MODE;
    if (mode === "production") return "production";
  }
  return "sandbox";
}

export function shouldUseDeterministicFulfillmentMocks(): boolean {
  return getFulfillmentIntegrationMode() !== "production";
}

export function isLiveFulfillmentEnabled(): boolean {
  return getFulfillmentIntegrationMode() === "production";
}
