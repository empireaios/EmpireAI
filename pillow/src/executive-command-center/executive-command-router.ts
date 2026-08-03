import type { ExecutiveCommandCenterConfiguration } from "./configuration.js";
import type { ExecutiveCommandCenterInput, ExecutiveCommandType, RoutedService } from "./types.js";
import { EXECUTIVE_COMMAND_TYPES, ROUTED_SERVICES } from "./paths.js";

const CAPABILITY_TO_SERVICE: Record<string, RoutedService> = {
  executive_query: "business_state",
  executive_planning: "missions",
  executive_monitoring: "workers",
  executive_reporting: "executive_reports",
  executive_routing: "tools",
  executive_inspection: "execution_memory",
  executive_review: "decision_memory",
  executive_approval: "approvals",
  executive_recovery: "workers",
  executive_coordination: "missions",
};

/** Routes executive requests to registered services without executing worker logic. */
export class ExecutiveCommandRouter {
  resolveCapability(
    input: ExecutiveCommandCenterInput,
    config: ExecutiveCommandCenterConfiguration,
  ): ExecutiveCommandType | string {
    const requested = (input.requestedCapability ?? "executive_query").toString().trim().toLowerCase();
    if (config.commandTypes.includes(requested)) return requested;
    if ((EXECUTIVE_COMMAND_TYPES as readonly string[]).includes(requested)) return requested;
    return requested || "executive_query";
  }

  resolveService(
    input: ExecutiveCommandCenterInput,
    capability: ExecutiveCommandType | string,
    config: ExecutiveCommandCenterConfiguration,
  ): RoutedService | string {
    const explicit = input.routedService?.toString().trim().toLowerCase();
    if (explicit) {
      if (config.routedServices.includes(explicit)) return explicit;
      if ((ROUTED_SERVICES as readonly string[]).includes(explicit)) return explicit;
      return explicit;
    }
    const mapped = CAPABILITY_TO_SERVICE[capability] ?? "business_state";
    if (config.routedServices.includes(mapped)) return mapped;
    return mapped;
  }

  isKnownService(service: string, config: ExecutiveCommandCenterConfiguration) {
    return (
      config.routedServices.includes(service) ||
      (ROUTED_SERVICES as readonly string[]).includes(service)
    );
  }

  isKnownCapability(capability: string, config: ExecutiveCommandCenterConfiguration) {
    return (
      config.commandTypes.includes(capability) ||
      (EXECUTIVE_COMMAND_TYPES as readonly string[]).includes(capability)
    );
  }
}
