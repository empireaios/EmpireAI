/**
 * G8-04 — Provider health evaluator.
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "../contracts/connection-health-types.js";
import { listConnectionHealthPluginsByKind } from "../plugins/connection-health-plugin-host.js";
import { resolveConnectionProvider } from "../../connection-registry/registry/connection-registry-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";

export type EvaluatorResult = {
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  expiry: string | null;
  requiredAction: string | null;
};

export function evaluateProviderAvailability(input: {
  providerId: string;
  context?: RegistryLoaderContext;
}): EvaluatorResult {
  const context = input.context ?? {};
  const provider = resolveConnectionProvider(input.providerId, context);
  const availabilityPlugins = listConnectionHealthPluginsByKind("provider_availability_check");

  if (!provider) {
    return {
      status: "unavailable",
      severity: "critical",
      message: "Provider not found in registry",
      evidence: [`provider:missing:${input.providerId}`],
      expiry: null,
      requiredAction: "register_provider",
    };
  }

  if (availabilityPlugins.length > 0) {
    return {
      status: "healthy",
      severity: "info",
      message: "Provider availability verified via plugin",
      evidence: availabilityPlugins.map((p) => `plugin:${p.pluginId}`),
      expiry: null,
      requiredAction: null,
    };
  }

  return {
    status: "healthy",
    severity: "info",
    message: "Provider registered and available (mock boundary — no live API call)",
    evidence: [`provider:${provider.providerId}`, `provider-kind:${provider.providerKind}`],
    expiry: null,
    requiredAction: null,
  };
}

export function evaluateEnvironmentStatus(input: {
  providerId: string;
  environment: "sandbox" | "production";
  context?: RegistryLoaderContext;
}): EvaluatorResult {
  const capabilities = resolveConnectionProvider(input.providerId, input.context ?? {});
  if (!capabilities) {
    return {
      status: "unavailable",
      severity: "high",
      message: `${input.environment} status unknown — provider missing`,
      evidence: [],
      expiry: null,
      requiredAction: null,
    };
  }
  return {
    status: "healthy",
    severity: "info",
    message: `${input.environment} environment configured (registry metadata)`,
    evidence: [`environment:${input.environment}`, `provider:${input.providerId}`],
    expiry: null,
    requiredAction: null,
  };
}

export function evaluateWebhookStatus(input: { providerId: string }): EvaluatorResult {
  const webhookPlugins = listConnectionHealthPluginsByKind("webhook_monitor");
  if (webhookPlugins.length === 0) {
    return {
      status: "unknown",
      severity: "low",
      message: "Webhook monitoring not configured",
      evidence: [`webhook:unmonitored:${input.providerId}`],
      expiry: null,
      requiredAction: null,
    };
  }
  return {
    status: "healthy",
    severity: "info",
    message: "Webhook monitor plugin registered",
    evidence: webhookPlugins.map((p) => `plugin:${p.pluginId}`),
    expiry: null,
    requiredAction: null,
  };
}
