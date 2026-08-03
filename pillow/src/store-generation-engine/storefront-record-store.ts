/** X1-07 — In-memory storefront record store. */

import { createHash } from "node:crypto";
import { SGE_METADATA_VERSION } from "./paths.js";
import type {
  DeploymentReadiness,
  StorefrontRecord,
  StorefrontStatus,
  ValidationStatus,
} from "./types.js";

export class StorefrontRecordStore {
  private readonly records = new Map<string, StorefrontRecord>();
  private readonly fingerprints = new Set<string>();

  list(): StorefrontRecord[] {
    return [...this.records.values()];
  }

  get(storefrontId: string): StorefrontRecord | undefined {
    return this.records.get(storefrontId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    brandReference: string;
    domainPlanReference: string;
    websiteStructureReference: string;
    navigationStructure: string;
    homepageLayout: string;
    productCatalogueStructure: string;
    categoryStructure: string;
    companyInformationPages: string;
    legalPageTemplates: string;
    deploymentPackageReference: string;
    storefrontStatus: StorefrontStatus;
    deploymentReadiness: DeploymentReadiness;
    validationStatus?: ValidationStatus;
  }): StorefrontRecord {
    const storefrontFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.brandReference}|${input.domainPlanReference}|${input.websiteStructureReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: StorefrontRecord = {
      storefrontId: `sge-sft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      brandReference: input.brandReference,
      domainPlanReference: input.domainPlanReference,
      websiteStructureReference: input.websiteStructureReference,
      navigationStructure: input.navigationStructure,
      homepageLayout: input.homepageLayout,
      productCatalogueStructure: input.productCatalogueStructure,
      categoryStructure: input.categoryStructure,
      companyInformationPages: input.companyInformationPages,
      legalPageTemplates: input.legalPageTemplates,
      deploymentPackageReference: input.deploymentPackageReference,
      storefrontStatus: input.storefrontStatus,
      deploymentReadiness: input.deploymentReadiness,
      storefrontFingerprint,
      structuralSignalOnly: true,
      automaticDeployment: false,
      fabricatedStorefrontFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: SGE_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: StorefrontRecord): void {
    this.records.set(record.storefrontId, { ...record });
    this.fingerprints.add(record.storefrontFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
