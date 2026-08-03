import type { MemoryRecord, MemoryRecommendation } from "./types.js";
export class MemoryRecommendationEngine {
  recommend(records: MemoryRecord[]): MemoryRecommendation[] {
    return records.filter((record) => record.validationStatus === "passed").map((record) => ({ recommendationId: `eme-rec-${record.memoryRecordId}`, timestamp: new Date().toISOString(), companyReference: record.companyReference, recommendationSummary: `Review validated ${record.memoryCategory} memory`, memoryValue: record.importanceLevel, structuralSignalOnly: true, unvalidatedClaim: "none" }));
  }
}
