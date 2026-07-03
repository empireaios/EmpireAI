/**
 * G6-04 — Operational readiness signal resolver (registry-driven — no secret exposure).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  REG_DOCTRINE,
  REG_INTEGRATION,
  REG_MARKETPLACE,
  REG_PAYMENT,
  REG_PROVIDER,
  REG_STOREFRONT,
  REG_SUPPLIER,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import { validateCertificationPillowGovernance } from "../../governance/certification-pillow-governance.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type OperationalSignalResult = {
  signalRef: string;
  satisfied: boolean;
  summary: string;
};

function resolveRegistry(context: RegistryLoaderContext, registryId: string): boolean {
  try {
    const result = getRegistryLoader().resolve(
      context,
      registryId as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

const SIGNAL_RESOLVERS: Record<string, (context: RegistryLoaderContext) => OperationalSignalResult> = {
  "signal:automation-module": (context) => {
    const module = resolveProgrammeModule("resolve:business-automation-module");
    return {
      signalRef: "signal:automation-module",
      satisfied: Boolean(module && module.programmeStatus === "certified"),
      summary: "Business automation module certified",
    };
  },
  "signal:commerce-module": (context) => {
    const module = resolveProgrammeModule("resolve:infrastructure-commerce-module");
    return {
      signalRef: "signal:commerce-module",
      satisfied: Boolean(module && module.programmeStatus === "production-certified"),
      summary: "Commerce module production certified",
    };
  },
  "signal:identity-module": (context) => {
    const module = resolveProgrammeModule("resolve:identity-registry-module");
    return {
      signalRef: "signal:identity-module",
      satisfied: Boolean(module),
      summary: "Identity registry module resolved",
    };
  },
  "signal:brain-available": () => ({
    signalRef: "signal:brain-available",
    satisfied: process.env.BRAIN_UNAVAILABLE !== "true",
    summary: "Brain execution available",
  }),
  "signal:pillow-available": (context) => {
    const ok = validateCertificationPillowGovernance({
      actorId: "operational-readiness-probe",
      workspaceId: context.workspaceId ?? "ws-foundation",
      operation: "overview",
      pillowGovernance: true,
    }).allowed;
    return { signalRef: "signal:pillow-available", satisfied: ok, summary: "Pillow governance available" };
  },
  "signal:ekls-available": (context) => {
    const ok = enforceEklsAccess(
      {
        pillowGovernance: true,
        actorId: "operational-readiness-probe",
        workspaceId: context.workspaceId ?? "ws-foundation",
        consumerChannel: "production-certification",
        operation: "search",
      },
      context.workspaceId ?? "ws-foundation",
    ).allowed;
    return { signalRef: "signal:ekls-available", satisfied: ok, summary: "EKLS channel available" };
  },
  "signal:registry-available": (context) => ({
    signalRef: "signal:registry-available",
    satisfied: resolveRegistry(context, REG_DOCTRINE),
    summary: "Registry catalog available",
  }),
  "signal:marketplace-registry": (context) => ({
    signalRef: "signal:marketplace-registry",
    satisfied: resolveRegistry(context, REG_MARKETPLACE),
    summary: "Marketplace registry wired",
  }),
  "signal:supplier-registry": (context) => ({
    signalRef: "signal:supplier-registry",
    satisfied: resolveRegistry(context, REG_SUPPLIER),
    summary: "Supplier registry wired",
  }),
  "signal:storefront-registry": (context) => ({
    signalRef: "signal:storefront-registry",
    satisfied: resolveRegistry(context, REG_STOREFRONT),
    summary: "Storefront registry wired",
  }),
  "signal:payment-registry": (context) => ({
    signalRef: "signal:payment-registry",
    satisfied: resolveRegistry(context, REG_PAYMENT),
    summary: "Payment registry wired",
  }),
  "signal:provider-catalog": (context) => ({
    signalRef: "signal:provider-catalog",
    satisfied: resolveRegistry(context, REG_PROVIDER),
    summary: "Provider catalog wired",
  }),
  "signal:integration-registry": (context) => ({
    signalRef: "signal:integration-registry",
    satisfied: resolveRegistry(context, REG_INTEGRATION),
    summary: "Integration registry wired",
  }),
  "signal:monitoring-ready": () => ({
    signalRef: "signal:monitoring-ready",
    satisfied: process.env.MONITORING_DISABLED !== "true",
    summary: "Monitoring operational",
  }),
  "signal:logging-ready": () => ({
    signalRef: "signal:logging-ready",
    satisfied: process.env.LOGGING_DISABLED !== "true",
    summary: "Logging operational",
  }),
  "signal:recovery-ready": () => ({
    signalRef: "signal:recovery-ready",
    satisfied: process.env.RECOVERY_DISABLED !== "true",
    summary: "Recovery procedures enabled",
  }),
  "signal:queue-ready": () => ({
    signalRef: "signal:queue-ready",
    satisfied: process.env.QUEUE_DISABLED !== "true" && process.env.QUEUE_FAILURES !== "true",
    summary: "Queue processing ready",
  }),
};

export function resolveOperationalSignal(
  signalRef: string,
  context: RegistryLoaderContext = {},
): OperationalSignalResult {
  return SIGNAL_RESOLVERS[signalRef]?.(context) ?? {
    signalRef,
    satisfied: false,
    summary: `Unknown operational signal: ${signalRef}`,
  };
}

export function resolveOperationalSignals(
  signalRefs: string[],
  context: RegistryLoaderContext = {},
): OperationalSignalResult[] {
  return signalRefs.map((ref) => resolveOperationalSignal(ref, context));
}
