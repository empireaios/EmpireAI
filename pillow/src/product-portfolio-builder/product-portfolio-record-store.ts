/** X1-08 — In-memory product portfolio record store. */

import { createHash } from "node:crypto";
import { PPB_METADATA_VERSION } from "./paths.js";
import type { ProductPortfolioRecord, ValidationStatus } from "./types.js";

export class ProductPortfolioRecordStore {
  private readonly records = new Map<string, ProductPortfolioRecord>();
  private readonly fingerprints = new Set<string>();

  list(): ProductPortfolioRecord[] {
    return [...this.records.values()];
  }

  get(portfolioId: string): ProductPortfolioRecord | undefined {
    return this.records.get(portfolioId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    businessModelReference: string;
    productReferences: string;
    productCategories: string;
    rankingSummary: string;
    overlappingProductsSummary: string;
    recommendations: string;
    portfolioProfitabilityScore: number;
    portfolioDemandScore: number;
    validationStatus?: ValidationStatus;
  }): ProductPortfolioRecord {
    const portfolioFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.businessModelReference}|${input.productReferences}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: ProductPortfolioRecord = {
      portfolioId: `ppb-prt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      businessModelReference: input.businessModelReference,
      productReferences: input.productReferences,
      productCategories: input.productCategories,
      rankingSummary: input.rankingSummary,
      overlappingProductsSummary: input.overlappingProductsSummary,
      recommendations: input.recommendations,
      portfolioProfitabilityScore: input.portfolioProfitabilityScore,
      portfolioDemandScore: input.portfolioDemandScore,
      portfolioFingerprint,
      structuralSignalOnly: true,
      automaticPublication: false,
      fabricatedPortfolioFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: PPB_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: ProductPortfolioRecord): void {
    this.records.set(record.portfolioId, { ...record });
    this.fingerprints.add(record.portfolioFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
