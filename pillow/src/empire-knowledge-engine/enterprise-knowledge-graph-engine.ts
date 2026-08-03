import type { KnowledgeRecord } from "./types.js";
/** Builds an in-memory structural graph; it never holds raw enterprise secrets. */
export class EnterpriseKnowledgeGraphEngine {
  build(records: KnowledgeRecord[]) { return { nodes: [...new Set(records.flatMap((r) => [r.sourceCompany, r.targetCompany]))], edges: records.map((r) => ({ from: r.sourceCompany, to: r.targetCompany, type: r.relationshipType, traceId: r.knowledgeTraceId })), structuralSignalOnly: true as const }; }
}
