/**
 * G2-05 — Payment capability resolution from registry-backed contracts.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  PAYMENT_DOMAIN_CAPABILITIES,
  PAYMENT_INTEGRATION_LIFECYCLE,
  type PaymentCapabilityResolution,
  type PaymentDomainCapability,
  type PaymentIntegrationLifecyclePhase,
  type PaymentMethodKind,
} from "../contracts/payment-integration-types.js";
import { parsePaymentIntegrationConfiguration } from "../validation/payment-contract-validator.js";
import {
  resolvePolicyForPayment,
  resolvePaymentRegistrySnapshot,
} from "./payment-registry-resolver.js";

function resolveDomainCapabilities(
  configuration: ReturnType<typeof parsePaymentIntegrationConfiguration>,
): PaymentDomainCapability[] {
  return PAYMENT_DOMAIN_CAPABILITIES.filter(
    (domain) => configuration.domainContracts[domain]?.supported === true,
  );
}

function isPolicyCompliant(
  context: RegistryLoaderContext,
  payment: Parameters<typeof resolvePolicyForPayment>[1],
): boolean {
  const policy = resolvePolicyForPayment(context, payment);
  if (!policy) {
    return payment.dependencies.length === 0;
  }
  return policy.status === "VALIDATED" || policy.status === "PUBLISHED";
}

export function resolvePaymentCapabilities(
  context: RegistryLoaderContext,
  providerId: string,
  lifecyclePhase: PaymentIntegrationLifecyclePhase = "discover",
): PaymentCapabilityResolution {
  const snapshot = resolvePaymentRegistrySnapshot(context, { registryRowId: providerId });
  const payment = snapshot.payments[0];
  if (!payment) {
    throw new Error(`Unknown payment registry row: ${providerId}`);
  }

  const integration = parsePaymentIntegrationConfiguration(payment.configuration);

  return {
    providerId: payment.id,
    resolvedCapabilities: resolveDomainCapabilities(integration),
    paymentMethods: integration.paymentMethods as PaymentMethodKind[],
    lifecyclePhase,
    policyCompliant: isPolicyCompliant(context, payment),
    registryBacked: true,
  };
}

export function resolveAllPaymentCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: PaymentIntegrationLifecyclePhase = "discover",
): PaymentCapabilityResolution[] {
  const snapshot = resolvePaymentRegistrySnapshot(context);
  return snapshot.payments.map((payment) =>
    resolvePaymentCapabilities(context, payment.id, lifecyclePhase),
  );
}

export function listSupportedPaymentLifecyclePhases(): readonly PaymentIntegrationLifecyclePhase[] {
  return PAYMENT_INTEGRATION_LIFECYCLE;
}
