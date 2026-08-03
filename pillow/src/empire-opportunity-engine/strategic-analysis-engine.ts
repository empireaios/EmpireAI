import type { EmpireOpportunityInput } from "./types.js";
export class StrategicAnalysisEngine { score(input: EmpireOpportunityInput) { return Math.max(0, Math.min(100, input.opportunityScore ?? 50)); } }
