/**
 * G6-09 — Simulation safety signal resolver (registry-driven — no live execution).
 */

import { resolveCockpitScreenContext } from "../../../../domain/services/cockpit-interaction-layer.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  REG_AUTOMATION_WORKFLOW,
  REG_MARKETPLACE,
  REG_PAYMENT,
  REG_STOREFRONT,
  REG_SUPPLIER,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import type { ProductionSimulationScenario } from "./simulation-scenario-registry-resolver.js";
import type { ProductionSimulationType } from "../contracts/production-simulation-types.js";
import { isSimulationTypeSafe } from "../contracts/production-simulation-types.js";

export type SimulationSignalResult = {
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

function cockpitRouteReady(scenario?: ProductionSimulationScenario): boolean {
  if (!scenario?.cockpitRouteRef) return true;
  if (readBooleanEnv("SIM_COCKPIT_UNSAFE", false)) return false;
  const screen = resolveCockpitScreenContext(scenario.cockpitRouteRef);
  return screen.screenId !== "SCR-000";
}

const SIGNAL_RESOLVERS: Record<
  string,
  (context: RegistryLoaderContext, scenario?: ProductionSimulationScenario, simulationType?: ProductionSimulationType) => SimulationSignalResult
> = {
  "signal:safe-execution-boundary": (_context, _scenario, simulationType) => ({
    signalRef: "signal:safe-execution-boundary",
    satisfied:
      !readBooleanEnv("SIM_UNSAFE_LIVE_EXECUTION", false) &&
      Boolean(simulationType && isSimulationTypeSafe(simulationType)),
    summary: "Simulation within safe execution boundary",
  }),
  "signal:commerce-sandbox": () => ({
    signalRef: "signal:commerce-sandbox",
    satisfied: !readBooleanEnv("SIM_COMMERCE_UNSAFE", false) && !readBooleanEnv("SIM_BLOCKED_SANDBOX", false),
    summary: "Commerce simulation sandbox ready",
  }),
  "signal:no-live-orders": () => ({
    signalRef: "signal:no-live-orders",
    satisfied: !readBooleanEnv("SIM_UNSAFE_LIVE_EXECUTION", false),
    summary: "No real orders executed",
  }),
  "signal:no-live-payments": () => ({
    signalRef: "signal:no-live-payments",
    satisfied: !readBooleanEnv("SIM_UNSAFE_LIVE_EXECUTION", false),
    summary: "No real payments captured",
  }),
  "signal:no-product-publish": () => ({
    signalRef: "signal:no-product-publish",
    satisfied: !readBooleanEnv("SIM_UNSAFE_LIVE_EXECUTION", false),
    summary: "No real products published",
  }),
  "signal:mock-provider-ready": () => ({
    signalRef: "signal:mock-provider-ready",
    satisfied: !readBooleanEnv("SIM_MISSING_MOCK_PROVIDER", false),
    summary: "Mock provider available",
  }),
  "signal:identity-sandbox": () => ({
    signalRef: "signal:identity-sandbox",
    satisfied: !readBooleanEnv("SIM_IDENTITY_UNSAFE", false),
    summary: "Identity simulation sandbox ready",
  }),
  "signal:cockpit-sandbox": (_context, scenario) => ({
    signalRef: "signal:cockpit-sandbox",
    satisfied: !readBooleanEnv("SIM_COCKPIT_UNSAFE", false) && cockpitRouteReady(scenario),
    summary: "Cockpit simulation sandbox ready",
  }),
  "signal:automation-sandbox": () => ({
    signalRef: "signal:automation-sandbox",
    satisfied: !readBooleanEnv("SIM_AUTOMATION_UNSAFE", false) && !readBooleanEnv("SIM_BLOCKED_SANDBOX", false),
    summary: "Automation simulation sandbox ready",
  }),
  "signal:evidence-ready": () => ({
    signalRef: "signal:evidence-ready",
    satisfied: !readBooleanEnv("SIM_MISSING_EVIDENCE", false),
    summary: "Simulation evidence ready",
  }),
  "signal:marketplace-registry": (context) => ({
    signalRef: "signal:marketplace-registry",
    satisfied: resolveRegistry(context, REG_MARKETPLACE),
    summary: "Marketplace registry available for simulation",
  }),
  "signal:payment-registry": (context) => ({
    signalRef: "signal:payment-registry",
    satisfied: resolveRegistry(context, REG_PAYMENT),
    summary: "Payment registry available for simulation",
  }),
  "signal:storefront-registry": (context) => ({
    signalRef: "signal:storefront-registry",
    satisfied: resolveRegistry(context, REG_STOREFRONT),
    summary: "Storefront registry available for simulation",
  }),
  "signal:supplier-registry": (context) => ({
    signalRef: "signal:supplier-registry",
    satisfied: resolveRegistry(context, REG_SUPPLIER),
    summary: "Supplier registry available for simulation",
  }),
  "signal:automation-workflow-registry": (context) => ({
    signalRef: "signal:automation-workflow-registry",
    satisfied: resolveRegistry(context, REG_AUTOMATION_WORKFLOW),
    summary: "Automation workflow registry available for simulation",
  }),
  "signal:commerce-module": () => {
    const module = resolveProgrammeModule("resolve:infrastructure-commerce-module");
    return {
      signalRef: "signal:commerce-module",
      satisfied: Boolean(module && module.programmeStatus === "production-certified"),
      summary: "Commerce module available for simulation",
    };
  },
};

export function resolveSimulationSignal(
  signalRef: string,
  context: RegistryLoaderContext = {},
  scenario?: ProductionSimulationScenario,
  simulationType?: ProductionSimulationType,
): SimulationSignalResult {
  return SIGNAL_RESOLVERS[signalRef]?.(context, scenario, simulationType) ?? {
    signalRef,
    satisfied: false,
    summary: `Unknown simulation signal: ${signalRef}`,
  };
}

export function resolveSimulationSignals(
  signalRefs: string[],
  context: RegistryLoaderContext = {},
  scenario?: ProductionSimulationScenario,
  simulationType?: ProductionSimulationType,
): SimulationSignalResult[] {
  return signalRefs.map((ref) => resolveSimulationSignal(ref, context, scenario, simulationType));
}
