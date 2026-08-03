import type { SimulationRecord } from "./types.js";
export class SimulationRecommendationEngine { recommend(record: SimulationRecord) { return record.validationStatus === "passed" ? record.recommendationSummary : "Unvalidated simulation intelligence cannot be optimized or executed."; } }
