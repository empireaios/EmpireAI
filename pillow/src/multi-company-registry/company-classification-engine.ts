/** X2-02 — Company classification engine. */

import { appendMcrLog } from "./mcr-logging.js";
import type { CompanyRegistrationEngine } from "./company-registration-engine.js";
import type { ClassifyCompanyInput, CompanyRegistryRecord } from "./types.js";

export class CompanyClassificationEngine {
  constructor(private readonly registration: CompanyRegistrationEngine) {}

  classify(input: ClassifyCompanyInput): CompanyRegistryRecord {
    const current = this.registration.get(input.companyId);
    if (!current) {
      throw new Error(`Company not found: ${input.companyId}`);
    }
    current.companyCategory = input.companyCategory;
    const updated = this.registration.upsert(current);
    appendMcrLog({
      event: "classification_update",
      level: "info",
      details: `Classified ${input.companyId} as ${input.companyCategory}`,
    });
    return updated;
  }
}
