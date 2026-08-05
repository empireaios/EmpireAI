import type { ToolStore } from "./tool-store.js";
import type { AvailabilityStatus, AvailabilitySummary, ToolRegistration } from "./types.js";

export class AvailabilityMonitor {
  /** Derive availability from recent invocations. */
  assessTool(store: ToolStore, toolId: string): ToolRegistration | null {
    const tool = store.getTool(toolId);
    if (!tool) return null;

    const invocations = store.listInvocationsForTool(toolId);
    let availabilityStatus: AvailabilityStatus = tool.availabilityStatus;

    if (invocations.length === 0) {
      availabilityStatus =
        tool.availabilityStatus === "standby" ? "standby" : "unknown";
    } else {
      const recent = invocations.slice(-5);
      const successes = recent.filter((i) => i.status === "success").length;
      const failures = recent.filter(
        (i) => i.status === "failed" || i.status === "unavailable",
      ).length;
      const unavailable = recent.filter((i) => i.status === "unavailable").length;

      if (unavailable === recent.length) {
        availabilityStatus = "unavailable";
      } else if (failures === 0) {
        availabilityStatus = "available";
      } else if (successes > failures) {
        availabilityStatus = "degraded";
      } else {
        availabilityStatus = "unavailable";
      }
    }

    return store.updateTool(toolId, { availabilityStatus });
  }

  assessAll(store: ToolStore): ToolRegistration[] {
    return store.listTools().map((t) => this.assessTool(store, t.toolId)!).filter(Boolean);
  }

  buildAvailabilitySummary(store: ToolStore): AvailabilitySummary {
    const tools = store.listTools();
    return {
      available: tools.filter((t) => t.availabilityStatus === "available").length,
      degraded: tools.filter((t) => t.availabilityStatus === "degraded").length,
      unavailable: tools.filter((t) => t.availabilityStatus === "unavailable").length,
      unknown: tools.filter((t) => t.availabilityStatus === "unknown").length,
      standby: tools.filter((t) => t.availabilityStatus === "standby").length,
    };
  }

  isAvailable(tool: ToolRegistration): boolean {
    return tool.availabilityStatus !== "unavailable";
  }
}
