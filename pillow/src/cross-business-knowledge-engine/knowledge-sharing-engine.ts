/** X2-04 — Knowledge sharing engine. */

import { appendCbkLog } from "./cbk-logging.js";
import type { EnterpriseKnowledgeRepository } from "./enterprise-knowledge-repository.js";
import type { KnowledgeRecord, ShareKnowledgeInput } from "./types.js";

export class KnowledgeSharingEngine {
  constructor(private readonly repository: EnterpriseKnowledgeRepository) {}

  share(input: ShareKnowledgeInput, defaultTargets: string[]): KnowledgeRecord {
    const current = this.repository.get(input.knowledgeRecordId);
    if (!current) {
      throw new Error(`Knowledge record not found: ${input.knowledgeRecordId}`);
    }
    if (current.confidentialContent) {
      throw new Error("Confidential knowledge cannot be shared");
    }
    if (current.reusabilityScore < 40) {
      throw new Error("Knowledge reusability too low for sharing");
    }

    const targets = (input.targetCompanies?.length
      ? input.targetCompanies
      : defaultTargets
    ).filter((t) => t && t !== current.sourceCompany);

    const merged = new Set([...current.sharedWith, ...targets]);
    current.sharedWith = [...merged];
    current.distributionStatus = current.sharedWith.length > 0 ? "shared" : "pending_share";

    const updated = this.repository.upsert(current);
    appendCbkLog({
      event: "knowledge_sharing",
      level: "info",
      details: `Shared ${input.knowledgeRecordId} with ${updated.sharedWith.length} company(ies)`,
    });
    return updated;
  }
}
