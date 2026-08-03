import type { KnowledgeRecord } from "./types.js";
export class CrossEnterpriseLearningEngine {
  reusable(records: KnowledgeRecord[]) { return records.filter((record) => record.validationStatus === "passed" && record.confidenceScore >= 55); }
  duplicates(records: KnowledgeRecord[]) { const seen = new Set<string>(); return records.filter((record) => { const key = `${record.sourceCompany}:${record.knowledgeCategory}`; if (seen.has(key)) return true; seen.add(key); return false; }); }
  gaps(records: KnowledgeRecord[]) { return records.length ? [] : ["No validated enterprise knowledge captured"]; }
}
