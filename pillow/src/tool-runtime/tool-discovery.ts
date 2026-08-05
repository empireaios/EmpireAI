import type { ToolStore } from "./tool-store.js";
import type { AvailabilityStatus, ToolCategory, ToolRegistration, ToolrtInput } from "./types.js";

export class ToolDiscovery {
  /** Discover/list tools filtered by category, provider, and/or availability. */
  discover(store: ToolStore, input: ToolrtInput = {}): ToolRegistration[] {
    let tools = store.listTools();

    if (input.toolId) {
      tools = tools.filter((t) => t.toolId === input.toolId);
    }
    if (input.toolCategory) {
      tools = tools.filter((t) => t.toolCategory === (input.toolCategory as ToolCategory));
    }
    if (input.provider) {
      tools = tools.filter((t) => t.provider === input.provider);
    }
    if (input.action === "available_only") {
      tools = tools.filter((t) => t.availabilityStatus === "available" || t.availabilityStatus === "degraded");
    }

    return tools;
  }

  resolve(store: ToolStore, toolId: string): ToolRegistration | null {
    return store.getTool(toolId);
  }

  listByAvailability(store: ToolStore, status: AvailabilityStatus): ToolRegistration[] {
    return store.listTools().filter((t) => t.availabilityStatus === status);
  }
}
