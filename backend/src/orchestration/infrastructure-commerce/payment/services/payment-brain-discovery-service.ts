/**
 * G2-05 — Brain payment capability discovery (RegistryLoader only — never bypasses Brain path).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  PAYMENT_DOMAIN_CAPABILITIES,
  type PaymentBrainCapabilityDescriptor,
} from "../contracts/payment-integration-types.js";
import { discoverPayments } from "./payment-integration-service.js";
import { resolveAllPaymentCapabilities } from "../registry/payment-capability-resolver.js";

export function discoverPaymentCapabilitiesForBrain(
  context: RegistryLoaderContext,
): PaymentBrainCapabilityDescriptor[] {
  const discovery = discoverPayments(context);
  const capabilityMap = new Map(
    resolveAllPaymentCapabilities(context).map((entry) => [entry.providerId, entry]),
  );

  return discovery.providers.map((provider) => {
    const resolved = capabilityMap.get(provider.providerId);
    return {
      providerId: provider.providerId,
      capabilities: provider.capabilities,
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      paymentMethods: provider.paymentMethods,
      discoverySource: "RegistryLoader:REG-PAYMENT" as const,
    };
  });
}

export function listPaymentBrainDomainCapabilities(): readonly string[] {
  return PAYMENT_DOMAIN_CAPABILITIES;
}
