/**
 * G6-05 — Business operations signal resolver (registry-driven — no secret exposure).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  REG_AUTOMATION_REPORT,
  REG_AUTOMATION_WORKFLOW,
  REG_COMMERCE_POLICY,
  REG_LOGISTICS,
  REG_MARKETPLACE,
  REG_PAYMENT,
  REG_STOREFRONT,
  REG_SUPPLIER,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";

export type BusinessSignalResult = {
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

const SIGNAL_RESOLVERS: Record<string, (context: RegistryLoaderContext) => BusinessSignalResult> = {
  "signal:marketplace-registry": (context) => ({
    signalRef: "signal:marketplace-registry",
    satisfied: resolveRegistry(context, REG_MARKETPLACE),
    summary: "Marketplace registry available",
  }),
  "signal:supplier-registry": (context) => ({
    signalRef: "signal:supplier-registry",
    satisfied: resolveRegistry(context, REG_SUPPLIER),
    summary: "Supplier registry available",
  }),
  "signal:storefront-registry": (context) => ({
    signalRef: "signal:storefront-registry",
    satisfied: resolveRegistry(context, REG_STOREFRONT),
    summary: "Storefront registry available",
  }),
  "signal:payment-registry": (context) => ({
    signalRef: "signal:payment-registry",
    satisfied: resolveRegistry(context, REG_PAYMENT),
    summary: "Payment registry available",
  }),
  "signal:logistics-registry": (context) => ({
    signalRef: "signal:logistics-registry",
    satisfied: resolveRegistry(context, REG_LOGISTICS),
    summary: "Logistics registry available",
  }),
  "signal:commerce-policy-registry": (context) => ({
    signalRef: "signal:commerce-policy-registry",
    satisfied: resolveRegistry(context, REG_COMMERCE_POLICY),
    summary: "Commerce policy registry available",
  }),
  "signal:automation-workflow-registry": (context) => ({
    signalRef: "signal:automation-workflow-registry",
    satisfied: resolveRegistry(context, REG_AUTOMATION_WORKFLOW),
    summary: "Automation workflow registry available",
  }),
  "signal:automation-report-registry": (context) => ({
    signalRef: "signal:automation-report-registry",
    satisfied: resolveRegistry(context, REG_AUTOMATION_REPORT),
    summary: "Automation report registry available",
  }),
  "signal:commerce-module": () => {
    const module = resolveProgrammeModule("resolve:infrastructure-commerce-module");
    return {
      signalRef: "signal:commerce-module",
      satisfied: Boolean(module && module.programmeStatus === "production-certified"),
      summary: "Commerce module production certified",
    };
  },
  "signal:automation-module": () => {
    const module = resolveProgrammeModule("resolve:business-automation-module");
    return {
      signalRef: "signal:automation-module",
      satisfied: Boolean(module && module.programmeStatus === "certified"),
      summary: "Business automation module certified",
    };
  },
  "signal:executive-intelligence-module": () => {
    const module = resolveProgrammeModule("resolve:executive-intelligence-orchestrator-module");
    return {
      signalRef: "signal:executive-intelligence-module",
      satisfied: Boolean(module),
      summary: "Executive intelligence orchestrator available",
    };
  },
  "signal:order-flow-ready": () => ({
    signalRef: "signal:order-flow-ready",
    satisfied: process.env.ORDER_LIFECYCLE_INCOMPLETE !== "true",
    summary: "Order lifecycle flow ready",
  }),
  "signal:payment-flow-ready": () => ({
    signalRef: "signal:payment-flow-ready",
    satisfied: process.env.PAYMENT_UNAVAILABLE !== "true",
    summary: "Payment flow ready",
  }),
  "signal:analytics-ready": () => ({
    signalRef: "signal:analytics-ready",
    satisfied: process.env.ANALYTICS_DISABLED !== "true",
    summary: "Business analytics operational",
  }),
};

export function resolveBusinessSignal(
  signalRef: string,
  context: RegistryLoaderContext = {},
): BusinessSignalResult {
  return SIGNAL_RESOLVERS[signalRef]?.(context) ?? {
    signalRef,
    satisfied: false,
    summary: `Unknown business signal: ${signalRef}`,
  };
}

export function resolveBusinessSignals(
  signalRefs: string[],
  context: RegistryLoaderContext = {},
): BusinessSignalResult[] {
  return signalRefs.map((ref) => resolveBusinessSignal(ref, context));
}
