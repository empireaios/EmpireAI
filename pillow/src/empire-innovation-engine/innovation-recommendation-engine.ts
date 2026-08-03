import type { InnovationRecord } from "./types.js";
export class InnovationRecommendationEngine {
  eligible(records: InnovationRecord[], threshold: number) { return records.filter((record) => record.validationStatus === "passed" && record.innovationScore >= threshold); }
}
