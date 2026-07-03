/**
 * G6-07 — Executive operations signal resolver (registry-driven — no secret exposure).
 */

import { resolveCockpitScreenContext } from "../../../../domain/services/cockpit-interaction-layer.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  REG_AUTOMATION_WORKFLOW,
  REG_CERTIFICATION_OPERATIONAL,
  REG_STOREFRONT,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import type { ExecutiveOperationsRule } from "./executive-operations-registry-resolver.js";

export type ExecutiveSignalResult = {
  signalRef: string;
  satisfied: boolean;
  summary: string;
};

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true";
}

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

function cockpitRouteReady(rule?: ExecutiveOperationsRule): boolean {
  if (readBooleanEnv("EXEC_MISSING_ROUTE", false)) return false;
  if (!rule?.cockpitRouteRef || !rule.expectedScreenId) return true;
  const screen = resolveCockpitScreenContext(rule.cockpitRouteRef);
  return screen.screenId === rule.expectedScreenId;
}

const SIGNAL_RESOLVERS: Record<
  string,
  (context: RegistryLoaderContext, rule?: ExecutiveOperationsRule) => ExecutiveSignalResult
> = {
  "signal:cockpit-route-ready": (_context, rule) => ({
    signalRef: "signal:cockpit-route-ready",
    satisfied: cockpitRouteReady(rule),
    summary: "Cockpit route resolves to expected screen",
  }),
  "signal:cockpit-panel-ready": () => ({
    signalRef: "signal:cockpit-panel-ready",
    satisfied: !readBooleanEnv("EXEC_BROKEN_PANEL", false),
    summary: "Cockpit panel operational",
  }),
  "signal:brain-module-ready": () => ({
    signalRef: "signal:brain-module-ready",
    satisfied: !readBooleanEnv("EXEC_MISSING_BRAIN_MODULE", false),
    summary: "Brain module available for executive operations",
  }),
  "signal:approval-visibility": () => ({
    signalRef: "signal:approval-visibility",
    satisfied: !readBooleanEnv("EXEC_MISSING_APPROVAL_VISIBILITY", false),
    summary: "Approval queue visibility available",
  }),
  "signal:automation-visibility": () => ({
    signalRef: "signal:automation-visibility",
    satisfied: !readBooleanEnv("EXEC_MISSING_AUTOMATION_VISIBILITY", false),
    summary: "Business automation visibility available",
  }),
  "signal:readiness-visibility": () => ({
    signalRef: "signal:readiness-visibility",
    satisfied: !readBooleanEnv("EXEC_MISSING_READINESS_VISIBILITY", false),
    summary: "Operational readiness visibility available",
  }),
  "signal:executive-report": () => ({
    signalRef: "signal:executive-report",
    satisfied: !readBooleanEnv("EXEC_MISSING_EXECUTIVE_REPORT", false),
    summary: "Executive report available",
  }),
  "signal:ai-assistant-context": () => ({
    signalRef: "signal:ai-assistant-context",
    satisfied: !readBooleanEnv("EXEC_MISSING_AI_ASSISTANT_CONTEXT", false),
    summary: "Global AI assistant context available",
  }),
  "signal:decision-visibility": (_context, rule) => ({
    signalRef: "signal:decision-visibility",
    satisfied: cockpitRouteReady(rule),
    summary: "Decision intelligence visibility available",
  }),
  "signal:commerce-visibility": (context) => ({
    signalRef: "signal:commerce-visibility",
    satisfied: resolveRegistry(context, REG_STOREFRONT),
    summary: "Commerce visibility available",
  }),
  "signal:risk-visibility": (_context, rule) => ({
    signalRef: "signal:risk-visibility",
    satisfied: cockpitRouteReady(rule),
    summary: "Risk visibility available",
  }),
  "signal:executive-action-safe": () => ({
    signalRef: "signal:executive-action-safe",
    satisfied: !readBooleanEnv("EXEC_UNSAFE_EXECUTIVE_ACTION", false),
    summary: "Executive actions within safety boundaries",
  }),
  "signal:ownership-clear": () => ({
    signalRef: "signal:ownership-clear",
    satisfied: !readBooleanEnv("EXEC_UNCLEAR_OWNERSHIP", false),
    summary: "Executive ownership clearly defined",
  }),
  "signal:evidence-complete": () => ({
    signalRef: "signal:evidence-complete",
    satisfied: !readBooleanEnv("EXEC_INCOMPLETE_EVIDENCE", false),
    summary: "Executive evidence complete",
  }),
  "signal:status-fresh": () => ({
    signalRef: "signal:status-fresh",
    satisfied: !readBooleanEnv("EXEC_STALE_STATUS", false),
    summary: "Executive status fresh",
  }),
  "signal:automation-module": () => {
    const module = resolveProgrammeModule("resolve:business-automation-module");
    return {
      signalRef: "signal:automation-module",
      satisfied: Boolean(module && module.programmeStatus === "certified"),
      summary: "Business automation module certified",
    };
  },
  "signal:commerce-module": () => {
    const module = resolveProgrammeModule("resolve:infrastructure-commerce-module");
    return {
      signalRef: "signal:commerce-module",
      satisfied: Boolean(module && module.programmeStatus === "production-certified"),
      summary: "Commerce module production certified",
    };
  },
  "signal:operational-readiness-registry": (context) => ({
    signalRef: "signal:operational-readiness-registry",
    satisfied: resolveRegistry(context, REG_CERTIFICATION_OPERATIONAL),
    summary: "Operational readiness registry available",
  }),
  "signal:automation-workflow-registry": (context) => ({
    signalRef: "signal:automation-workflow-registry",
    satisfied: resolveRegistry(context, REG_AUTOMATION_WORKFLOW),
    summary: "Automation workflow registry available",
  }),
};

export function resolveExecutiveSignal(
  signalRef: string,
  context: RegistryLoaderContext = {},
  rule?: ExecutiveOperationsRule,
): ExecutiveSignalResult {
  return SIGNAL_RESOLVERS[signalRef]?.(context, rule) ?? {
    signalRef,
    satisfied: false,
    summary: `Unknown executive signal: ${signalRef}`,
  };
}

export function resolveExecutiveSignals(
  signalRefs: string[],
  context: RegistryLoaderContext = {},
  rule?: ExecutiveOperationsRule,
): ExecutiveSignalResult[] {
  return signalRefs.map((ref) => resolveExecutiveSignal(ref, context, rule));
}
