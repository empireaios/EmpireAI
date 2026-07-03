/**
 * G2-05 — Pillow governance for payment permissions, trust, isolation, policy, and security.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  PaymentIntegrationLifecyclePhase,
  PaymentPluginManifest,
} from "../contracts/payment-integration-types.js";
import { validatePaymentSecurityProfile } from "../validation/payment-security-validator.js";
import { buildPaymentAdapterContract } from "../validation/payment-contract-validator.js";
import {
  resolveCurrenciesForPayment,
  resolvePaymentRowById,
  resolvePolicyForPayment,
} from "../registry/payment-registry-resolver.js";

export type PaymentPillowGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  providerId: string;
  operation:
    | "discover"
    | "validate"
    | "register"
    | "authenticate"
    | "create_payment_intent"
    | "authorise"
    | "capture"
    | "refund"
    | "payout"
    | "reconcile"
    | "monitor"
    | "archive";
  lifecyclePhase?: PaymentIntegrationLifecyclePhase;
  pillowGovernance: true;
};

export type PaymentPillowGovernanceResult = {
  allowed: boolean;
  reason: string;
  trustVerified: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  securityValidated: boolean;
  eklsGoverned: boolean;
};

export function validatePaymentPluginManifestStructure(
  manifest: PaymentPluginManifest,
): PaymentPillowGovernanceResult {
  if (!manifest.pillowGovernance) {
    return deny("Payment plugins require pillowGovernance: true");
  }
  if (!manifest.pluginId?.trim() || !manifest.version?.trim()) {
    return deny("Payment plugin manifest requires pluginId and version");
  }
  if (!manifest.paymentRegistryRowId?.trim()) {
    return deny("Payment plugin manifest requires paymentRegistryRowId");
  }
  if (manifest.securityFeatures.length === 0) {
    return deny("Payment plugin manifest requires at least one security feature");
  }
  return {
    allowed: true,
    reason: "Payment plugin manifest structure valid",
    trustVerified: true,
    policyCompliant: false,
    workspaceIsolated: false,
    securityValidated: false,
    eklsGoverned: false,
  };
}

function deny(reason: string): PaymentPillowGovernanceResult {
  return {
    allowed: false,
    reason,
    trustVerified: false,
    policyCompliant: false,
    workspaceIsolated: false,
    securityValidated: false,
    eklsGoverned: false,
  };
}

export function validatePaymentPillowGovernance(
  context: PaymentPillowGovernanceContext,
): PaymentPillowGovernanceResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — pillowGovernance must be true");
  }
  if (!context.actorId?.trim()) {
    return deny("actorId is required for payment governance audit");
  }
  if (!context.workspaceId?.trim()) {
    return deny("workspaceId is required for payment workspace isolation");
  }

  const payment = resolvePaymentRowById(context, context.providerId);
  if (!payment) {
    return deny(`Payment registry row not found: ${context.providerId}`);
  }

  const policy = resolvePolicyForPayment(context, payment);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";
  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Payment policy compliance check failed",
      trustVerified: true,
      policyCompliant: false,
      workspaceIsolated: true,
      securityValidated: false,
      eklsGoverned: false,
    };
  }

  const contract = buildPaymentAdapterContract(
    payment,
    resolveCurrenciesForPayment(context, payment),
  );
  const security = validatePaymentSecurityProfile(contract);
  if (!security.valid) {
    return {
      allowed: false,
      reason: security.reason,
      trustVerified: true,
      policyCompliant: true,
      workspaceIsolated: true,
      securityValidated: false,
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: "retrieve",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      trustVerified: true,
      policyCompliant: true,
      workspaceIsolated: false,
      securityValidated: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Payment permissions, trust, isolation, policy, and security validation passed",
    trustVerified: true,
    policyCompliant: true,
    workspaceIsolated: true,
    securityValidated: true,
    eklsGoverned: true,
  };
}
