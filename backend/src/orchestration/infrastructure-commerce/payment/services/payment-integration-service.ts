/**
 * G2-05 — Payment integration service (discovery, validation, health, lifecycle).
 */

import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  PaymentAdapterContract,
  PaymentDiscoveryResult,
  PaymentHealthSnapshot,
  PaymentIntegrationLifecyclePhase,
} from "../contracts/payment-integration-types.js";
import { validatePaymentPillowGovernance } from "../governance/payment-pillow-governance.js";
import { transitionPaymentLifecycle } from "../lifecycle/payment-integration-lifecycle.js";
import { resolveAllPaymentCapabilities } from "../registry/payment-capability-resolver.js";
import {
  resolveCurrenciesForPayment,
  resolvePaymentRegistrySnapshot,
} from "../registry/payment-registry-resolver.js";
import {
  assertUniquePaymentProviderIds,
  buildPaymentAdapterContract,
} from "../validation/payment-contract-validator.js";
import { validatePaymentSecurityProfile } from "../validation/payment-security-validator.js";
import { buildPaymentDomainContractBundle } from "./payment-domain-contract-service.js";

const lifecycleState = new Map<string, PaymentIntegrationLifecyclePhase>();

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverPayments(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): PaymentDiscoveryResult {
  const snapshot = resolvePaymentRegistrySnapshot(context, query);
  const providers = snapshot.payments.map((row) =>
    buildPaymentAdapterContract(
      row,
      resolveCurrenciesForPayment(context, row),
      "unknown",
      "validated",
    ),
  );
  assertUniquePaymentProviderIds(providers);

  for (const provider of providers) {
    if (!lifecycleState.has(provider.providerId)) {
      lifecycleState.set(provider.providerId, "discover");
    }
  }

  return {
    discoveredCount: providers.length,
    providers,
    generatedAt: nowIso(),
    discoverySource: "RegistryLoader:REG-PAYMENT",
  };
}

export function validatePaymentIntegration(
  context: RegistryLoaderContext,
  providerId: string,
): { valid: boolean; contract?: PaymentAdapterContract; reason: string } {
  const snapshot = resolvePaymentRegistrySnapshot(context, { registryRowId: providerId });
  const row = snapshot.payments[0];
  if (!row) {
    return {
      valid: false,
      reason: `Payment registry row not found: ${providerId}`,
    };
  }

  try {
    const contract = buildPaymentAdapterContract(
      row,
      resolveCurrenciesForPayment(context, row),
    );
    buildPaymentDomainContractBundle(context, row);
    const security = validatePaymentSecurityProfile(contract);
    if (!security.valid) {
      return { valid: false, reason: security.reason };
    }
    lifecycleState.set(providerId, "validate");
    return { valid: true, contract, reason: "Payment integration contract validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function getPaymentHealthSnapshot(
  context: RegistryLoaderContext,
  providerId: string,
): PaymentHealthSnapshot {
  const capabilities = resolveAllPaymentCapabilities(context).find(
    (entry) => entry.providerId === providerId,
  );
  const phase = lifecycleState.get(providerId) ?? "discover";

  return {
    providerId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advancePaymentLifecycle(input: {
  actorId: string;
  workspaceId: string;
  providerId: string;
  targetPhase: PaymentIntegrationLifecyclePhase;
  pillowGovernance: true;
}): ReturnType<typeof transitionPaymentLifecycle> {
  const governance = validatePaymentPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    operation: input.targetPhase,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const currentPhase = lifecycleState.get(input.providerId) ?? "discover";
    return {
      providerId: input.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = lifecycleState.get(input.providerId) ?? "discover";
  const result = transitionPaymentLifecycle(currentPhase, {
    providerId: input.providerId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    lifecycleState.set(input.providerId, result.currentPhase);
  }

  return result;
}

export function resetPaymentIntegrationStateForTests(): void {
  lifecycleState.clear();
}
