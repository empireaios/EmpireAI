import type { EmpireIntelligenceModuleRegistry } from "./empire-intelligence-module-registry.js";
import type { RouteIntelligenceEventInput } from "./types.js";
export class EmpireEventRouter {
  constructor(private registry: EmpireIntelligenceModuleRegistry) {}
  route(input: RouteIntelligenceEventInput): { routed: boolean; details: string } {
    const module = this.registry.get(input.intelligenceModuleIdentifier);
    if (!module) throw new Error("Intelligence module not found");
    if (module.operationalState !== "active") throw new Error("Intelligence module is not active");
    return { routed: true, details: `Structural event routed to ${input.intelligenceModuleIdentifier}` };
  }
}
