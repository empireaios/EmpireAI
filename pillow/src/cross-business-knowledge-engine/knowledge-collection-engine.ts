/** X2-04 — Knowledge collection engine. */

import type { EnterpriseKnowledgeRepository } from "./enterprise-knowledge-repository.js";
import type { CollectKnowledgeInput, KnowledgeRecord } from "./types.js";

export class KnowledgeCollectionEngine {
  constructor(private readonly repository: EnterpriseKnowledgeRepository) {}

  collect(input: CollectKnowledgeInput): KnowledgeRecord {
    return this.repository.collect(input);
  }
}
