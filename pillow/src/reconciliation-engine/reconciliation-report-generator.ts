/** R3-08 — Reconciliation report generator. */

import type { ReconciliationMetadataGenerator } from "./reconciliation-metadata-generator.js";
import type { ReconciliationRecord } from "./types.js";

export class ReconciliationReportGenerator {
  constructor(private readonly metadataGenerator: ReconciliationMetadataGenerator) {}

  generate(scope: string, records: ReconciliationRecord[]) {
    return this.metadataGenerator.buildReport({ scope, records });
  }
}
