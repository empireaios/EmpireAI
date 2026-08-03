import type { GlobalExpansionSimulationInput } from "./types.js";
/** Builds structural scenario inputs; it has no production-system adapter. */
export class ScenarioSimulationEngine { project(input: GlobalExpansionSimulationInput = {}) { return { ...input, structuralSignalOnly: true as const }; } }
