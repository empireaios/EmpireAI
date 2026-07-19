/** R3-04 — Revenue classification engine. */

import type { RevenueEngineConfiguration } from "./configuration.js";
import type { RevenueRecord, RevenueSource } from "./types.js";

export type RevenueClassification = {
  revenueSource: RevenueSource;
  businessReference: string;
  marketplaceReference: string | null;
  classificationLabel: string;
};

export class RevenueClassificationEngine {
  classify(
    input: {
      revenueSource: RevenueSource;
      marketplaceReference?: string | null;
      businessReference?: string | null;
      paymentReference?: string | null;
    },
    config: RevenueEngineConfiguration,
  ): RevenueClassification {
    if (!config.classificationRulesEnabled) {
      return {
        revenueSource: input.revenueSource,
        businessReference: input.businessReference ?? "default",
        marketplaceReference: input.marketplaceReference ?? null,
        classificationLabel: "unclassified",
      };
    }

    const business = input.businessReference ?? "default";
    const marketplace = input.marketplaceReference ?? null;
    let label: string = input.revenueSource;

    if (input.revenueSource === "payment" && input.paymentReference) {
      label = "completed_payment";
    } else if (input.revenueSource === "marketplace" && marketplace) {
      label = `marketplace:${marketplace}`;
    } else if (input.revenueSource === "supplier_settlement") {
      label = "supplier_settlement";
    } else if (input.revenueSource === "refund") {
      label = "refund_adjustment";
    }

    return {
      revenueSource: input.revenueSource,
      businessReference: business,
      marketplaceReference: marketplace,
      classificationLabel: label,
    };
  }

  applyClassification(
    record: RevenueRecord,
    classification: RevenueClassification,
  ): RevenueRecord {
    return {
      ...record,
      businessReference: classification.businessReference,
      marketplaceReference: classification.marketplaceReference ?? record.marketplaceReference,
    };
  }
}
