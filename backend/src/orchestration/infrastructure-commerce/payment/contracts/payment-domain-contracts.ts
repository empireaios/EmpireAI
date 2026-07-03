/**
 * G2-05 — Payment domain contract definitions (framework contracts only).
 */

import type {
  PaymentAuthenticationMethod,
  PaymentDomainCapability,
  PaymentMethodKind,
  PaymentSecurityFeature,
} from "./payment-integration-types.js";

export type PaymentAuthenticationContract = {
  contractKind: "authentication";
  contractVersion: string;
  authenticationMethod: PaymentAuthenticationMethod;
  securityFeatures: PaymentSecurityFeature[];
  credentialIsolated: true;
  pillowGoverned: true;
};

export type PaymentIntentContract = {
  contractKind: "payment_intent";
  contractVersion: string;
  supportedMethods: PaymentMethodKind[];
  tokenisationRequired: boolean;
};

export type PaymentAuthorisationContract = {
  contractKind: "authorisation";
  contractVersion: string;
  idempotencyRequired: boolean;
  permissionIsolated: true;
};

export type PaymentCaptureContract = {
  contractKind: "capture";
  contractVersion: string;
  partialCaptureSupported: boolean;
};

export type PaymentRefundContract = {
  contractKind: "refund";
  contractVersion: string;
  refundSupported: boolean;
  policyRef: string | null;
};

export type PaymentPayoutContract = {
  contractKind: "payout";
  contractVersion: string;
  payoutSupported: boolean;
  policyRef: string | null;
};

export type PaymentWebhookContract = {
  contractKind: "webhook";
  contractVersion: string;
  webhookSupported: boolean;
  verificationRequired: boolean;
};

export type PaymentDomainContractBundle = {
  authentication: PaymentAuthenticationContract;
  paymentIntent: PaymentIntentContract;
  authorisation: PaymentAuthorisationContract;
  capture: PaymentCaptureContract;
  refund: PaymentRefundContract;
  payout: PaymentPayoutContract;
  webhook: PaymentWebhookContract;
};

export const PAYMENT_DOMAIN_CONTRACT_KINDS: PaymentDomainCapability[] = [
  "authentication",
  "payment_intent",
  "authorisation",
  "capture",
  "refund",
  "payout",
  "webhook",
];

export function listPaymentDomainContractKinds(): readonly PaymentDomainCapability[] {
  return PAYMENT_DOMAIN_CONTRACT_KINDS;
}
