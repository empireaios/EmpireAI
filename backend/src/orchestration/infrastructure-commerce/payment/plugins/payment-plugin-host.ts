/**
 * G2-05 — Payment plugin host (registry + framework registration only).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_PAYMENT } from "../../../../registry/types/registry-ids.js";
import type {
  PaymentHealthStatus,
  PaymentPluginManifest,
  PaymentPluginRecord,
} from "../contracts/payment-integration-types.js";
import {
  validatePaymentPillowGovernance,
  validatePaymentPluginManifestStructure,
} from "../governance/payment-pillow-governance.js";
import { resolvePaymentRowById } from "../registry/payment-registry-resolver.js";

const PAYMENT_PLUGIN_KIND: RegistryPluginKind = "commerce_payment";

function nowIso(): string {
  return new Date().toISOString();
}

export class PaymentPluginHost {
  private readonly records = new Map<string, PaymentPluginRecord>();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): { discoveredCount: number; plugins: PaymentPluginRecord[]; generatedAt: string } {
    const governance = validatePaymentPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      providerId: "pay-foundation-psp-primary",
      operation: "discover",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => manifest.kind === PAYMENT_PLUGIN_KIND);

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        paymentRegistryRowId:
          typeof manifest.extensions.paymentRegistryRowId === "string"
            ? manifest.extensions.paymentRegistryRowId
            : "pay-foundation-psp-primary",
        paymentMethods: ["card"],
        securityFeatures: ["tokenisation", "credential_isolation"],
        pillowGovernance: true,
        extensions: manifest.extensions,
        lifecyclePhase: "discover",
        healthStatus: "unknown" as PaymentHealthStatus,
        registeredAt: manifest.registeredAt ?? nowIso(),
      });
    }

    return {
      discoveredCount: this.records.size,
      plugins: [...this.records.values()],
      generatedAt: nowIso(),
    };
  }

  registerPlugin(
    input: {
      actorId: string;
      workspaceId: string;
      pillowGovernance: true;
    },
    manifest: PaymentPluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validatePaymentPluginManifestStructure(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validatePaymentPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      providerId: manifest.paymentRegistryRowId,
      operation: "register",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const payment = resolvePaymentRowById(
      { workspaceId: input.workspaceId },
      manifest.paymentRegistryRowId,
    );
    if (!payment?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target payment registry row does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Payment plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: PAYMENT_PLUGIN_KIND,
      targetRegistryId: REG_PAYMENT,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        paymentRegistryRowId: manifest.paymentRegistryRowId,
        paymentMethods: manifest.paymentMethods,
        securityFeatures: manifest.securityFeatures,
      },
    });

    if (!frameworkResult.accepted) {
      return frameworkResult;
    }

    this.records.set(manifest.pluginId, {
      ...manifest,
      lifecyclePhase: "register",
      healthStatus: "unknown",
      registeredAt: nowIso(),
    });

    return {
      accepted: true,
      pluginId: manifest.pluginId,
      message: "Payment plugin registered via framework host",
    };
  }

  listPlugins(): PaymentPluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: PaymentPluginHost | undefined;

export function getPaymentPluginHost(): PaymentPluginHost {
  if (!sharedHost) {
    sharedHost = new PaymentPluginHost();
  }
  return sharedHost;
}

export function resetPaymentPluginHostForTests(): void {
  sharedHost = undefined;
}
