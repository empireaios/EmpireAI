import type { KnowledgeRecord, KnowledgeRelationshipType } from "./types.js";
export class KnowledgeRelationshipEngine {
  map(records: KnowledgeRecord[], relationshipType?: KnowledgeRelationshipType) { return records.filter((record) => !relationshipType || record.relationshipType === relationshipType).map((record) => ({ source: record.sourceCompany, target: record.targetCompany, relationshipType: record.relationshipType, structuralSignalOnly: true as const })); }
}
