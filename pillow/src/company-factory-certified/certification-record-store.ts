/** X1-15 — In-memory certification report store. */

import { createHash } from "node:crypto";
import { CFC_METADATA_VERSION } from "./paths.js";
import type {
  CompanyFactoryCertificationReport,
  ModuleCertificationResult,
  ModulePassStatus,
  ValidationStatus,
} from "./types.js";

export class CertificationRecordStore {
  private readonly records = new Map<string, CompanyFactoryCertificationReport>();
  private readonly fingerprints = new Set<string>();

  list(): CompanyFactoryCertificationReport[] {
    return [...this.records.values()];
  }

  get(certificationId: string): CompanyFactoryCertificationReport | undefined {
    return this.records.get(certificationId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    certifiedCompanyFactoryModules: string;
    opportunityDiscoveryStatus: ModulePassStatus;
    marketValidationStatus: ModulePassStatus;
    businessModelStatus: ModulePassStatus;
    brandCreationStatus: ModulePassStatus;
    storeGenerationStatus: ModulePassStatus;
    productPortfolioStatus: ModulePassStatus;
    launchStatus: ModulePassStatus;
    perModulePassFailStatus: ModuleCertificationResult[];
    warnings: string[];
    errors: string[];
    endToEndValidationResult: ModulePassStatus;
    overallCertificationStatus: CompanyFactoryCertificationReport["overallCertificationStatus"];
    evidenceReferences: string;
    validationStatus?: ValidationStatus;
  }): CompanyFactoryCertificationReport {
    const certificationFingerprint = createHash("sha256")
      .update(
        `${input.certifiedCompanyFactoryModules}|${input.overallCertificationStatus}|${input.endToEndValidationResult}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: CompanyFactoryCertificationReport = {
      certificationId: `cfc-crt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      certifiedCompanyFactoryModules: input.certifiedCompanyFactoryModules,
      opportunityDiscoveryStatus: input.opportunityDiscoveryStatus,
      marketValidationStatus: input.marketValidationStatus,
      businessModelStatus: input.businessModelStatus,
      brandCreationStatus: input.brandCreationStatus,
      storeGenerationStatus: input.storeGenerationStatus,
      productPortfolioStatus: input.productPortfolioStatus,
      launchStatus: input.launchStatus,
      perModulePassFailStatus: input.perModulePassFailStatus,
      warnings: input.warnings,
      errors: input.errors,
      endToEndValidationResult: input.endToEndValidationResult,
      overallCertificationStatus: input.overallCertificationStatus,
      evidenceReferences: input.evidenceReferences,
      certificationFingerprint,
      structuralSignalOnly: true,
      modifiedProductionSystemsWithoutSafeTestMode: false,
      fabricatedCertificationFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: CFC_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: CompanyFactoryCertificationReport): void {
    this.records.set(record.certificationId, {
      ...record,
      perModulePassFailStatus: record.perModulePassFailStatus.map((m) => ({ ...m })),
      warnings: [...record.warnings],
      errors: [...record.errors],
    });
    this.fingerprints.add(record.certificationFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
