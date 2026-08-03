import type { OpportunityRecord } from "./types.js";
export class OpportunityRecommendationEngine {
  eligible(records: OpportunityRecord[], threshold: number) { return records.filter((record) => record.validationStatus === "passed" && record.opportunityScore >= threshold); }
}
