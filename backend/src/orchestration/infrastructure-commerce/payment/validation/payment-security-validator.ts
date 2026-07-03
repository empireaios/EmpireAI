/**
 * G2-05 — Payment security validation (framework-only — no credential storage).
 */

import type { PaymentAdapterContract } from "../contracts/payment-integration-types.js";
import type { PaymentSecurityValidationResult } from "../contracts/payment-integration-types.js";

const REQUIRED_SECURITY_FOR_LIVE_READINESS = [
  "tokenisation",
  "credential_isolation",
  "permission_isolation",
] as const;

export function validatePaymentSecurityProfile(
  contract: PaymentAdapterContract,
): PaymentSecurityValidationResult {
  const features = new Set(contract.securityFeatures);
  const tokenisationReady = features.has("tokenisation");
  const webhookVerificationReady =
    !contract.webhookSupport.supported || features.has("webhook_verification");
  const credentialIsolated = features.has("credential_isolation");

  const missing = REQUIRED_SECURITY_FOR_LIVE_READINESS.filter((feature) => !features.has(feature));
  const valid = missing.length === 0 && webhookVerificationReady;

  return {
    providerId: contract.providerId,
    valid,
    tokenisationReady,
    webhookVerificationReady,
    credentialIsolated,
    reason: valid
      ? "Payment security profile validated — no credentials stored in framework"
      : `Payment security profile incomplete: missing ${missing.join(", ") || "webhook verification"}`,
  };
}

export function assertNoSensitivePaymentPayload(payload: Record<string, unknown>): boolean {
  const forbiddenKeys = ["pan", "cvv", "cardNumber", "accountNumber", "secretKey", "apiSecret"];
  for (const key of forbiddenKeys) {
    if (key in payload) {
      return false;
    }
  }
  return true;
}
