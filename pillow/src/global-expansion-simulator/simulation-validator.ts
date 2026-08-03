import type { GlobalExpansionSimulationInput } from "./types.js";
export class SimulationValidator { validate(input: GlobalExpansionSimulationInput) { return { valid: Boolean(input.targetCountry || input.targetRegion), structuralSignalOnly: true as const, neverExecuteSimulatedActionsAgainstProductionSystems: true as const }; } }
