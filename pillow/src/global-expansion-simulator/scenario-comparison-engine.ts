import type { SimulationRecord } from "./types.js";
export class ScenarioComparisonEngine { compare(records: SimulationRecord[]) { return [...records].sort((a, b) => (b.readinessProjection + b.financialProjection - b.riskProjection) - (a.readinessProjection + a.financialProjection - a.riskProjection)); } }
