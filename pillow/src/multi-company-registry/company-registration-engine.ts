/** X2-02 — Company registration engine. */

import { appendMcrLog } from "./mcr-logging.js";
import { MCR_METADATA_VERSION } from "./paths.js";
import type { CompanyRegistryRecord, RegisterCompanyInput } from "./types.js";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildIdentityKey(companyName: string, ownershipReference: string): string {
  return `${normalizeName(companyName)}::${ownershipReference.trim().toLowerCase()}`;
}

export class CompanyRegistrationEngine {
  private records = new Map<string, CompanyRegistryRecord>();
  private identityIndex = new Map<string, string>();

  list(): CompanyRegistryRecord[] {
    return [...this.records.values()];
  }

  get(companyId: string): CompanyRegistryRecord | null {
    return this.records.get(companyId) ?? null;
  }

  findByIdentity(companyName: string, ownershipReference: string): CompanyRegistryRecord | null {
    const key = buildIdentityKey(companyName, ownershipReference);
    const id = this.identityIndex.get(key);
    return id ? (this.records.get(id) ?? null) : null;
  }

  findDuplicates(companyId?: string): CompanyRegistryRecord[] {
    if (companyId) {
      const target = this.records.get(companyId);
      if (!target) return [];
      return this.list().filter(
        (r) => r.companyId !== companyId && r.identityKey === target.identityKey,
      );
    }

    const seen = new Map<string, CompanyRegistryRecord[]>();
    for (const record of this.list()) {
      const bucket = seen.get(record.identityKey) ?? [];
      bucket.push(record);
      seen.set(record.identityKey, bucket);
    }
    return [...seen.values()].filter((b) => b.length > 1).flat();
  }

  register(input: RegisterCompanyInput): CompanyRegistryRecord {
    const companyId =
      input.companyId?.trim() ||
      `mcr-co-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const ownershipReference =
      input.ownershipReference?.trim() || `structural://ownership/${companyId}`;
    const identityKey = buildIdentityKey(input.companyName, ownershipReference);

    const record: CompanyRegistryRecord = {
      companyRegistryId: `mcr-${companyId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companyId,
      companyName: input.companyName.trim(),
      companyCategory: input.companyCategory ?? "general",
      companyLifecycleStage: input.companyLifecycleStage ?? "forming",
      operationalStatus: input.operationalStatus ?? "pending",
      ownershipReference,
      validationStatus: "passed",
      metadataVersion: MCR_METADATA_VERSION,
      identityKey,
      structuralSignalOnly: true,
      bypassedValidation: false,
    };

    this.records.set(companyId, record);
    this.identityIndex.set(identityKey, companyId);

    appendMcrLog({
      event: "company_registration",
      level: "info",
      details: `Registered company ${companyId} · ${record.companyCategory}`,
    });

    return record;
  }

  upsert(record: CompanyRegistryRecord): CompanyRegistryRecord {
    record.timestamp = new Date().toISOString();
    this.records.set(record.companyId, record);
    this.identityIndex.set(record.identityKey, record.companyId);
    return record;
  }

  resetForTesting(): void {
    this.records.clear();
    this.identityIndex.clear();
  }
}
