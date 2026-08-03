/** X2-04 — Knowledge classification engine. */

import { appendCbkLog } from "./cbk-logging.js";
import type { EnterpriseKnowledgeRepository } from "./enterprise-knowledge-repository.js";
import type { ClassifyKnowledgeInput, KnowledgeRecord } from "./types.js";

export class KnowledgeClassificationEngine {
  constructor(private readonly repository: EnterpriseKnowledgeRepository) {}

  classify(input: ClassifyKnowledgeInput): KnowledgeRecord {
    const current = this.repository.get(input.knowledgeRecordId);
    if (!current) {
      throw new Error(`Knowledge record not found: ${input.knowledgeRecordId}`);
    }

    current.knowledgeCategory = input.knowledgeCategory;
    current.identityKey = `${current.sourceCompany.trim().toLowerCase()}::${input.knowledgeCategory}::${current.knowledgeSummary.trim().toLowerCase().replace(/\s+/g, " ")}`;
    const updated = this.repository.upsert(current);

    appendCbkLog({
      event: "knowledge_classification",
      level: "info",
      details: `Classified ${input.knowledgeRecordId} as ${input.knowledgeCategory}`,
    });

    return updated;
  }
}
