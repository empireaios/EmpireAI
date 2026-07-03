/**
 * G2-05 — Payment capability bridge for Business Engines (no embedded business logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { PaymentEngineCapabilityEnvelope } from "../contracts/payment-integration-types.js";
import { discoverPayments } from "./payment-integration-service.js";
import { resolveAllPaymentCapabilities } from "../registry/payment-capability-resolver.js";

const PAYMENT_ENGINE_BINDINGS: readonly CommerceEngineModule[] = [
  "live-payment-engine",
  "marketplace-infrastructure-engine",
  "storefront-assembly-engine",
  "analytics-intelligence-engine",
];

const PAYMENT_CONSUMER_BINDINGS = ["business-automation"] as const;

export function listPaymentEngineBindings(): readonly CommerceEngineModule[] {
  return PAYMENT_ENGINE_BINDINGS;
}

export function listPaymentConsumerBindings(): readonly string[] {
  return PAYMENT_CONSUMER_BINDINGS;
}

export function providePaymentCapabilityToConsumer(
  context: RegistryLoaderContext,
  consumerId: string,
  providerId?: string,
): PaymentEngineCapabilityEnvelope[] {
  const allowedConsumers = [
    ...PAYMENT_ENGINE_BINDINGS,
    ...PAYMENT_CONSUMER_BINDINGS,
  ] as readonly string[];

  if (!allowedConsumers.includes(consumerId)) {
    return [];
  }

  const discovery = discoverPayments(context);
  const capabilities = resolveAllPaymentCapabilities(context);
  const targets = providerId
    ? discovery.providers.filter((entry) => entry.providerId === providerId)
    : discovery.providers;

  return targets.map((provider) => {
    const resolved = capabilities.find((entry) => entry.providerId === provider.providerId);
    return {
      consumerId,
      providerId: provider.providerId,
      capabilityIds: provider.capabilities.map((capability) => `REG-PAYMENT:${capability}`),
      domainCapabilities: resolved?.resolvedCapabilities ?? [],
      discoverySource: "RegistryLoader:payment-engine-bridge" as const,
    };
  });
}

export function providePaymentCapabilityToEngine(
  context: RegistryLoaderContext,
  engineModule: CommerceEngineModule,
  providerId?: string,
): PaymentEngineCapabilityEnvelope[] {
  return providePaymentCapabilityToConsumer(context, engineModule, providerId);
}

export function providePaymentCapabilityToAllConsumers(
  context: RegistryLoaderContext,
): PaymentEngineCapabilityEnvelope[] {
  const consumers = [...PAYMENT_ENGINE_BINDINGS, ...PAYMENT_CONSUMER_BINDINGS];
  return consumers.flatMap((consumerId) => providePaymentCapabilityToConsumer(context, consumerId));
}
