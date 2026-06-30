/** Centralized env flag reads — modules must not hardcode business gates. */
export function readGovernanceEnvFlag(key: string): boolean {
  const value = process.env[key];
  return value === "true" || value === "1";
}

export const GOVERNANCE_ENV_FLAGS = {
  PRODUCTION_DEPLOYMENT: "PRODUCTION_DEPLOYMENT_ENABLED",
  META_ADS_LAUNCH: "META_ADS_LAUNCH_ENABLED",
  LIVE_PAYMENT: "LIVE_PAYMENT_ENABLED",
  LIVE_CJ_FULFILLMENT: "LIVE_CJ_FULFILLMENT_ENABLED",
  CUSTOMER_ORDER_LIVE_FULFILLMENT: "CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED",
  REVENUE_LOOP_LIVE: "REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED",
  GUARDIAN: "GUARDIAN_ENABLED",
} as const;

export type GovernanceEnvFlagKey = keyof typeof GOVERNANCE_ENV_FLAGS;

export function isGovernanceEnvEnabled(flagKey: GovernanceEnvFlagKey): boolean {
  return readGovernanceEnvFlag(GOVERNANCE_ENV_FLAGS[flagKey]);
}
