import type { EmpireInnovationInput } from "./types.js";
export class StrategicAnalysisEngine { score(input: EmpireInnovationInput) { return Math.max(0, Math.min(100, input.innovationScore ?? 50)); } }
