/** X2-02 — Company profile manager. */

import { appendMcrLog } from "./mcr-logging.js";
import type { CompanyRegistrationEngine } from "./company-registration-engine.js";
import type { CompanyRegistryRecord, UpdateCompanyProfileInput } from "./types.js";

export class CompanyProfileManager {
  constructor(private readonly registration: CompanyRegistrationEngine) {}

  updateProfile(input: UpdateCompanyProfileInput): CompanyRegistryRecord {
    const current = this.registration.get(input.companyId);
    if (!current) {
      throw new Error(`Company not found: ${input.companyId}`);
    }

    if (input.companyName !== undefined) current.companyName = input.companyName.trim();
    if (input.companyCategory !== undefined) current.companyCategory = input.companyCategory;
    if (input.operationalStatus !== undefined) current.operationalStatus = input.operationalStatus;
    if (input.ownershipReference !== undefined) {
      current.ownershipReference = input.ownershipReference.trim();
      current.identityKey = `${current.companyName.trim().toLowerCase().replace(/\s+/g, " ")}::${current.ownershipReference.toLowerCase()}`;
    }

    const updated = this.registration.upsert(current);
    appendMcrLog({
      event: "company_update",
      level: "info",
      details: `Updated profile for ${input.companyId}`,
    });
    return updated;
  }
}
